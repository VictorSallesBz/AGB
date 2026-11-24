import useLanguageStore from "@/store/languageStore"

function Notfound() {
  const { language } = useLanguageStore()
  return (
    <div className="flex items-center justify-center h-full text-agb-text-secondary">
      {language === "pt" ? "Página não encontrada" : "Page not found"}
    </div>
  )
}

export default Notfound
