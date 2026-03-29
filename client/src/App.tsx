import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').limit(1)
        if (error) throw error
        console.log('Supabase connected successfully')
      } catch (error) {
        console.error('Error connecting to Supabase:', error)
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Welcome to Your App
        </h1>
        <p className="text-gray-700">
          React + TypeScript + Tailwind + Supabase
        </p>
      </div>
    </div>
  )
}

export default App