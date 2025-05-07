'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Verifying your email...')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        
        if (type === 'email_confirmation' || type === 'signup') {
          if (accessToken) {

            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (error) {
              throw error
            }
            
            setMessage('Email verified successfully! Redirecting to login...')
            
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          } else {
            setError('No access token found in URL')
            setTimeout(() => {
              router.push('/login')
            }, 3000)
          }
        } else {
          // Not an email confirmation, redirect to login
          setMessage('Redirecting to login...')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(`Error verifying email: ${err.message}`)
        
        // Redirect to login on error after showing message
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        
        {error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <div className="text-gray-700 mb-4">{message}</div>
        )}
        
        <p className="text-sm text-gray-500">
          You will be redirected to the login page shortly.
          If you are not redirected, <button 
            onClick={() => router.push('/login')}
            className="text-purple-300 underline"
          >
            click here
          </button>.
        </p>
        <Spinner className="mt-4" />
      </Card>
    </div>
  )
}