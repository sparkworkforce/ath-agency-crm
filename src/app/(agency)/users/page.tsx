import { requireAgencySession } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { listAgencyUsers } from '@/lib/services/users.service'
import UsersManager from '@/features/users/UsersManager'

export default async function UsersPage() {
  const session = await requireAgencySession().catch(() => redirect('/login'))

  const users = await listAgencyUsers(session.user.agencyId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
      </div>
      <UsersManager initialUsers={users} currentUserId={session.user.id} />
    </div>
  )
}
