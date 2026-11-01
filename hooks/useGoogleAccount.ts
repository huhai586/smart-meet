import { useEffect, useState } from "react"
import { GoogleStorageKey, readStoredGoogleUser, type GoogleUser } from "~/utils/google-account"

/** Who is signed in to Google, kept up to date when another page signs in or out. */
export const useGoogleAccount = (): { loading: boolean; user: GoogleUser | null } => {
  const [state, setState] = useState<{ loading: boolean; user: GoogleUser | null }>({ loading: true, user: null })

  useEffect(() => {
    let alive = true
    const read = () => readStoredGoogleUser().then((user) => alive && setState({ loading: false, user }))
    read()

    const watched: string[] = Object.values(GoogleStorageKey)
    const onChanged = (changes: Record<string, unknown>, area: string) => {
      if (area === "local" && watched.some((key) => key in changes)) read()
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      alive = false
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  return state
}

export default useGoogleAccount
