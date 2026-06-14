const STORAGE_KEY = 'biometric_available'
const CREDENTIAL_KEY = 'biometric_credential_id'

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false
    }

    if ('isUserVerifyingPlatformAuthenticatorAvailable' in PublicKeyCredential) {
      const available = await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    }

    return false
  } catch (e) {
    return false
  }
}

export function hasBiometricSetup(): boolean {
  try {
    return localStorage.getItem(CREDENTIAL_KEY) !== null
  } catch (e) {
    return false
  }
}

export async function registerBiometric(): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const userHandle = crypto.getRandomValues(new Uint8Array(16))

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: '密码管家',
        id: window.location.hostname
      },
      user: {
        id: userHandle,
        name: '用户',
        displayName: '密码管家用户'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      },
      timeout: 60000
    }

    const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential

    if (credential && credential.rawId) {
      const id = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
      localStorage.setItem(CREDENTIAL_KEY, id)
      return true
    }

    return false
  } catch (e) {
    console.error('Biometric registration failed:', e)
    return false
  }
}

export async function authenticateBiometric(): Promise<boolean> {
  try {
    const storedId = localStorage.getItem(CREDENTIAL_KEY)
    if (!storedId) {
      throw new Error('未设置生物识别')
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const idBytes = Uint8Array.from(atob(storedId), c => c.charCodeAt(0))

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: [
        {
          type: 'public-key',
          id: idBytes
        }
      ],
      userVerification: 'required',
      timeout: 60000
    }

    const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential

    return assertion !== null
  } catch (e) {
    console.error('Biometric authentication failed:', e)
    throw e
  }
}

export function clearBiometric(): void {
  try {
    localStorage.removeItem(CREDENTIAL_KEY)
  } catch (e) {
    // ignore
  }
}
