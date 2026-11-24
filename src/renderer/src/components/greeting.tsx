import { useMemo, useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import useLanguageStore from "@/store/languageStore"

function Greeting() {
  const { language } = useLanguageStore()
  const [name, setName] = useState("")

  useEffect(() => {
    const cached = localStorage.getItem("agb:user") || localStorage.getItem("agb:user")
    if (cached) {
      setName(cached)
    } else {
      invoke({ channel: "get-user-name" })
        .then((username) => {
          if (username) {
            setName(username)
            localStorage.setItem("agb:user", username)
          }
        })
        .catch((err) => {
          console.error("Error fetching user name:", err)
        })
    }
  }, [])

  const generalGreetings = useMemo(() => {
    if (language === "pt") {
      return ["Olá", "Bem-vindo", "Bem-vindo de volta", "Bom ver você"]
    }
    return [
      "Welcome",
      "Welcome back",
      "Hello",
      "Good to see you",
    ]
  }, [language])

  const timeGreetings = useMemo(() => {
    const hour = new Date().getHours()
    if (language === "pt") {
      if (hour < 12) return ["Bom dia"]
      if (hour < 18) return ["Boa tarde"]
      return ["Boa noite"]
    }
    if (hour < 12) return ["Good morning"]
    if (hour < 18) return ["Good afternoon"]
    return ["Good evening"]
  }, [language])

  const randomGreeting = useMemo(() => {
    const allGreetings = [...generalGreetings, ...timeGreetings]
    return allGreetings[Math.floor(Math.random() * allGreetings.length)]
  }, [generalGreetings, timeGreetings])

  return (
    <h1 className="text-2xl font-bold mb-4">
      {randomGreeting},{" "}
      <span className="bg-linear-to-r from-agb-primary to-agb-secondary bg-clip-text text-transparent">
        {name || (language === "pt" ? "amigo" : "friend")}
      </span>
    </h1>
  )
}

export default Greeting
