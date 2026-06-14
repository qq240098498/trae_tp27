import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './store/AppContext'
import SetupPassword from './components/SetupPassword'
import Login from './components/Login'
import PasswordList from './components/PasswordList'
import { isBiometricAvailable, hasBiometricSetup, authenticateBiometric } from './utils/biometric'
import { getEncryptedData, saveEncryptedData } from './utils/storage'
import { decryptData, encryptData } from './utils/crypto'

function AppContent() {
  const {
    isInitialized,
    isUnlocked,
    checkInitialized,
    setMasterPassword,
    unlock
  } = useApp()

  const [loading, setLoading] = useState(true)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricSetup, setBiometricSetup] = useState(false)

  useEffect(() => {
    const init = async () => {
      await checkInitialized()
      const available = await isBiometricAvailable()
      setBiometricAvailable(available)
      setBiometricSetup(available && hasBiometricSetup())
      setLoading(false)
    }
    init()
  }, [checkInitialized])

  const handleBiometricLogin = async () => {
    try {
      await authenticateBiometric()
      const encrypted = await getEncryptedData()
      if (!encrypted) {
        throw new Error('没有找到数据')
      }
    } catch (e) {
      throw e
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>加载中...</p>
      </div>
    )
  }

  if (!isInitialized) {
    return <SetupPassword onSetup={setMasterPassword} />
  }

  if (!isUnlocked) {
    return (
      <Login
        onLogin={unlock}
        hasBiometric={biometricAvailable && biometricSetup}
        onBiometricLogin={handleBiometricLogin}
      />
    )
  }

  return <PasswordList />
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
