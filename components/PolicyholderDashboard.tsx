import React, { useEffect, useState } from "react"
import { UserCircle, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"

export default function PolicyholderDashboard({ user }: { user: any }) {
  const [dataMap, setDataMap] = useState<Record<string, any[]>>({})
  const [activeTab, setActiveTab] = useState("policies")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (err) {
      console.error("Failed to sign out:", err)
    }
  }

  const fetchData = async (type: string) => {
    try {
      setLoading(true)
      setError(null)

      const endpoints: Record<string, string> = {
        policies: "/api/policyholder/mypolicies",
        claims: "/api/policyholder/myclaims",
        payments: "/api/policyholder/mypayments",
        status: "/api/policyholder/mystatus",
        about: "/api/policyholder/profile/display",
        help: "/api/support"
      }

      if (!(type in endpoints)) {
        setError("Invalid data type requested.")
        return
      }

      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const res = await fetch(endpoints[type], {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        setError("Failed to fetch data.")
        return
      }

      const data = await res.json()
      setDataMap((prev) => ({ ...prev, [type]: data }))
    } catch (error) {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab])

  const renderTable = (data: any[]) => {
    if (!data.length) return <p className="text-gray-500">No data found.</p>
    return (
      <div className="overflow-auto border rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key} className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {Object.entries(row).map(([key, val], i) => (
                  <td key={i} className="px-4 py-2 text-sm text-gray-700">
                    {String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderClaimsTable = (claims: any[]) => {
    if (!claims.length) return <p className="text-gray-500">No claims found. Click "Submit a New Claim" to file a claim.</p>
    return (
      <div className="overflow-auto border rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Claim ID</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Type</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Date</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Amount</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Status</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Description</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {claims.map((claim, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-700 font-mono">{claim.id}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{claim.claim_type}</td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {new Date(claim.date_of_incident).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {new Intl.NumberFormat().format(claim.claim_amount)}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    claim.public_status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                    claim.public_status === 'IN_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {claim.public_status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  <p className="truncate max-w-xs" title={claim.incident_description}>
                    {claim.incident_description}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const dataToRender = dataMap[activeTab] || []

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-blue-900 text-white flex flex-col px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
        <nav className="space-y-4">
          {['policies', 'claims', 'payments', 'status', 'about', 'help'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`block w-full text-left capitalize ${activeTab === tab ? 'font-bold underline' : ''}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-blue-700">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="w-6 h-6" />
            <span>{user?.name ?? "Policyholder"}</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-300 hover:text-red-100 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-gray-800">Welcome, {user?.name ?? "User"}</h2>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-700 capitalize">{activeTab}</h3>
            <div className="space-x-2">
              <button
                onClick={() => fetchData(activeTab)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh {activeTab}
              </button>
              {activeTab === "claims" && (
                <Link href="/dashboard/claims/submit">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Submit a New Claim
                  </button>
                </Link>
              )}
              {activeTab === "about" && (
                <Link href="/dashboard/profile/edit">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Edit Profile
                  </button>
                </Link>
              )}
            </div>
          </div>

          {loading && <p className="text-blue-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (
            <>
              {activeTab === "claims" ? renderClaimsTable(dataToRender) : renderTable(dataToRender)}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
