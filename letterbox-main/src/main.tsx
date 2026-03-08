import { supabase } from './supabase'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function testSupabase() {
  const { data, error } = await supabase.from('letters').select('*')
  console.log('Supabase response:', data, error)
}

testSupabase()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)