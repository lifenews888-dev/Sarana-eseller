import { NextRequest, NextResponse } from 'next/server'
import { getVatMonitorData } from '@/lib/tax/vatMonitor'
import { requireAdminDB } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req)
  if (admin instanceof NextResponse) return admin

  try {
    const data = await getVatMonitorData()
    const stats = {
      vatRegistered: data.filter((d) => d.vatStatus === 'exceeded').length,
      warning: data.filter((d) => d.vatStatus === 'warning').length,
      exceeded: data.filter((d) => d.vatStatus === 'exceeded').length,
    }
    return NextResponse.json({ shops: data, stats })
  } catch (error) {
    return NextResponse.json({ shops: [], stats: { vatRegistered: 0, warning: 0, exceeded: 0 } })
  }
}
