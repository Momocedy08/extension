(function () {
  console.log("Content script injecté");

  const params = new URLSearchParams(window.location.search);

  const prenom = params.get("firstname");
  const nom = params.get("lastname");
  const codePostal = params.get("zip");
  const adresse = params.get("address");
  const telephone = params.get("phone");
  // Utilisation de setIntervalle pour gerer la durer de remplissage
  const tryFillForm = setInterval(() => {
    const champPrenom = document.querySelector("input[name='input_1.3']");
    const champNom = document.querySelector("input[name='input_1.6']");
    const champAdresse = document.querySelector("input[name='input_3.5']");
    const champCodePostal = document.querySelector("input[name='input_3.1']");
    const champTelephone = document.querySelector("input[name='input_4']");

    if (champPrenom && champNom && champAdresse && champCodePostal && champTelephone) {
      champPrenom.value = prenom || "";
      champNom.value = nom || "";
      champAdresse.value = adresse || "";
      champCodePostal.value = codePostal || "";
      champTelephone.value = telephone || "";

      console.log("Champs du formulaire remplis !");
      clearInterval(tryFillForm);
    } else {
      console.log("En attente du formulaire...");
    }
  }, 500); // essaie toutes les 500 ms

  //  arrête d'essayer Après 10 secondes
  setTimeout(() => clearInterval(tryFillForm), 10000);
})();