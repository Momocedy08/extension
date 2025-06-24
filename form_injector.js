// form_injector.js
// Écoute les messages envoyés depuis la popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "remplirFormulaire") {
    remplirFormulaire(message.data, message.project);
    sendResponse({ status: "formulaire rempli" });
  }
});
// Fonction pour remplir dynamiquement les champs du formulaire
function remplirFormulaire(data, project) {
  const tryFillForm = setInterval(() => {
    let allFilled = true;
    for (const champFormulaire in data) {
      let valeur = data[champFormulaire];
      if (typeof valeur === "string" && valeur.startsWith("project.")) {
        const cle = valeur.split('.')[1];
        valeur = project[cle] || "";
      }
      const champ = document.querySelector(`[name='${champFormulaire}']`);
      if (champ) {
        champ.value = valeur;
        console.log(`Champ "${champFormulaire}" rempli avec : ${valeur}`);
      } else {
        console.warn(` Champ "${champFormulaire}" introuvable pour le moment`);
        allFilled = false;
      }
    }
    if (allFilled) {
      clearInterval(tryFillForm);
      console.log("Tous les champs ont été remplis.");
    }
  }, 200); // on réessaie toutes les 200 ms jusqu'à ce que tous les champs soient là
}
