'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getTeams() {
    const teams = await prisma.team.findMany({
        include: {
            players: true,
        },
    })
    return teams
}

export async function getGames() {
    const games = await prisma.game.findMany({
        orderBy: {
            id: 'asc',
        },
        include: {
            battingStats: true,
            pitchingStats: true,
        }
    })

    // Parse innings from JSON string back to array
    return games.map(game => ({
        ...game,
        innings: JSON.parse(game.innings),
        // Ensure numeric fields are numbers if they came out as null/string (safety)
        team1Id: String(game.team1Id),
        team2Id: String(game.team2Id),
        score1: game.score1?.toString() ?? "",
        score2: game.score2?.toString() ?? "",
        hits1: game.hits1?.toString() ?? "",
        hits2: game.hits2?.toString() ?? "",
        errors1: game.errors1?.toString() ?? "",
        errors2: game.errors2?.toString() ?? "",
    }))
}

export async function saveBattingStat(data: { playerId: number, gameId: number, stats: any }) {
    const { playerId, gameId, stats } = data;

    await prisma.battingStat.upsert({
        where: {
            playerId_gameId: {
                playerId,
                gameId
            }
        },
        update: stats,
        create: {
            playerId,
            gameId,
            ...stats
        }
    });

    revalidatePath('/');
}

export async function savePitchingStat(data: { playerId: number, gameId: number, stats: any }) {
    const { playerId, gameId, stats } = data;

    await prisma.pitchingStat.upsert({
        where: {
            playerId_gameId: {
                playerId,
                gameId
            }
        },
        update: stats,
        create: {
            playerId,
            gameId,
            ...stats
        }
    });

    revalidatePath('/');
}

export async function getAllStats() {
    const battingStats = await prisma.battingStat.findMany({
        include: {
            player: {
                include: {
                    team: true
                }
            }
        }
    });

    const pitchingStats = await prisma.pitchingStat.findMany({
        include: {
            player: {
                include: {
                    team: true
                }
            }
        }
    });

    return { battingStats, pitchingStats };
}

export async function updateGame(gameId: number, data: any) {
    // data contains the fields to update
    // We need to be careful with types. 
    // expected data: { score1, score2, innings (array), etc }

    const updateData: any = {}

    if (data.score1 !== undefined) updateData.score1 = parseInt(data.score1) || 0
    if (data.score2 !== undefined) updateData.score2 = parseInt(data.score2) || 0
    if (data.hits1 !== undefined) updateData.hits1 = parseInt(data.hits1) || 0
    if (data.hits2 !== undefined) updateData.hits2 = parseInt(data.hits2) || 0
    if (data.errors1 !== undefined) updateData.errors1 = parseInt(data.errors1) || 0
    if (data.errors2 !== undefined) updateData.errors2 = parseInt(data.errors2) || 0

    if (data.innings) {
        updateData.innings = JSON.stringify(data.innings)
    }

    // also handle team IDs if they change (unlikely for scheduled games but possible for championship)
    if (data.team1Id) updateData.team1Id = parseInt(data.team1Id)
    if (data.team2Id) updateData.team2Id = parseInt(data.team2Id)

    await prisma.game.update({
        where: { id: gameId },
        data: updateData,
    })

    revalidatePath('/')
}

export async function importPlayers(teamId: number, csvData: string) {
    console.log(`Starting import for team ${teamId}, string length: ${csvData.length}`);
    const lines = csvData.trim().split('\n');
    let importedCount = 0;

    // Clear existing players for this team to avoid duplicates/conflicts? 
    // For now, let's keep appending, but we might hit unique constraints if refactoring.
    // The user request implies simple import.

    for (const line of lines) {
        const trimmedLine = line.trim();
        // Skip header lines or empty lines
        if (!trimmedLine || trimmedLine.includes('UNIFORME N') || trimmedLine.toUpperCase().startsWith('TEAM')) {
            console.log("Skipping header/empty line:", trimmedLine);
            continue;
        }

        // Try comma split first
        let parts = trimmedLine.split(',').map(p => p.trim());

        // If not enough parts, try tab split (common from Excel copy-paste)
        if (parts.length < 3) {
            parts = trimmedLine.split('\t').map(p => p.trim());
        }

        console.log(`Processing line: "${trimmedLine}" -> Parts found: ${parts.length}`);

        if (parts.length >= 2) { // Allow at least Number + Name
            const number = parseInt(parts[0]) || 0;

            // Flexible parsing based on length
            // Format: NUMBER, LASTNAME, FIRSTNAME, POSITION, COUNTRY
            let fullName = "";
            let role = "UNKNOWN";
            let placeOfBirth = "UNKNOWN";

            if (parts.length >= 3) {
                // Has First and Last Name separated
                const lastName = parts[1] || "";
                const firstName = parts[2] || "";
                fullName = `${firstName} ${lastName}`.trim();

                if (parts.length > 3) role = parts[3];
                if (parts.length > 4) placeOfBirth = parts[4];
            } else {
                // Just Number and Name combined? Or just one name field?
                fullName = parts[1];
            }

            try {
                await prisma.player.create({
                    data: {
                        teamId: teamId,
                        number: number,
                        name: fullName,
                        role: role,
                        placeOfBirth: placeOfBirth
                    }
                });
                importedCount++;
            } catch (e) {
                console.error(`Failed to create player ${fullName}:`, e);
            }
        }
    }

    console.log(`Import finished. Total imported: ${importedCount}`);
    revalidatePath('/');
    return { success: true, count: importedCount };
}

export async function updatePlayer(playerId: number, data: { number?: number, name?: string, role?: string, placeOfBirth?: string }) {
    await prisma.player.update({
        where: { id: playerId },
        data: data
    });
    revalidatePath('/');
    return { success: true };
}

export async function resetTournamentScores() {
    try {
        // 1. Delete all batting and pitching stats
        await prisma.battingStat.deleteMany({});
        await prisma.pitchingStat.deleteMany({});

        // 2. Reset all games to initial state
        await prisma.game.updateMany({
            data: {
                score1: null,
                score2: null,
                hits1: null,
                hits2: null,
                errors1: null,
                errors2: null,
                innings: "[]"
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to reset tournament scores:", error);
        return { success: false, error: "Failed to reset scores" };
    }
}
