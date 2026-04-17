import { useAuth } from '../../hooks/useAuth'

export function Header() {
  const { profile, signOut } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {profile?.full_name ?? 'Utilisateur'}
          {profile?.role && (
            <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {profile.role}
            </span>
          )}
        </span>
        <button
          onClick={signOut}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Deconnexion
        </button>
      </div>
    </header>
  )
}
