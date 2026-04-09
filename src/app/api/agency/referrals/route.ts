import { NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

// GET — get or create referral code + list referrals
export async function GET() {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const agencyId = session.user.agencyId

  // Get or create referral code
  let referral = await prisma.referral.findFirst({ where: { referrerAgencyId: agencyId, referredAgencyId: null } })
  if (!referral) {
    const code = `cbh-${crypto.randomUUID().slice(0, 8)}`
    referral = await prisma.referral.create({ data: { referrerAgencyId: agencyId, code } })
  }

  // List successful referrals
  const referrals = await prisma.referral.findMany({
    where: { referrerAgencyId: agencyId, referredAgencyId: { not: null } },
    orderBy: { redeemedAt: 'desc' },
  })

  return NextResponse.json({ code: referral.code, referrals, totalReferred: referrals.length })
}
