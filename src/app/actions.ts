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
