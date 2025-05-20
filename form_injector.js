// form_injector.js

// Ecoute les messages depuis la popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "remplirFormulaireIouston") {
    remplirFormulaireIouston(message.data);
    sendResponse({ status: "iouston rempli" });
  } else if (message.action === "remplirFormulaireInedis") {
    remplirFormulaireInedis(message.data);
    sendResponse({ status: "inedis rempli" });
  }
});

// Fonction pour remplir le formulaire Iouston
function remplirFormulaireIouston(data) {
  const { firstname, lastname, zip, address, phone } = data;

  const tryFillForm = setInterval(() => {
    const champPrenom = document.querySelector("input[name='input_1.3']");
    const champNom = document.querySelector("input[name='input_1.6']");
    const champAdresse = document.querySelector("input[name='input_3.5']");
    const champCodePostal = document.querySelector("input[name='input_3.1']");
    const champTelephone = document.querySelector("input[name='input_4']");

    if (champPrenom && champNom && champAdresse && champCodePostal && champTelephone) {
      champPrenom.value = firstname || "";
      champNom.value = lastname || "";
      champAdresse.value = address || "";
      champCodePostal.value = zip || "";
      champTelephone.value = phone || "";

      console.log("Formulaire Iouston rempli !");
      clearInterval(tryFillForm);
    } else {
      console.log("En attente du formulaire Iouston...");
    }
  }, 500);

  // Arrête après 10s si le formulaire n'est pas prêt
  setTimeout(() => clearInterval(tryFillForm), 10000);
}
