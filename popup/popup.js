  document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  const configForm = document.getElementById("config-form");
  const mainContent = document.getElementById("main-content");
  const saveBtn = document.getElementById("saveBtn");
  //console.log("Script chargé, saveBtn:", saveBtn);
  const editConfigBtn = document.getElementById("editConfigBtn");
  const baseUrlInput = document.getElementById("baseUrl");
  const apiKeyInput = document.getElementById("apiKey");
  const cancelBtn = document.getElementById('cancelStatusBtn');
  const fillFormButton = document.getElementById("fillFormButton");
  const BASE_URL = localStorage.getItem("BASE_URL");
  const API_KEY = localStorage.getItem("API_KEY");

  function showErrorMessage(message) {
    console.log("showErrorMessage called with:", message);
  const messageErreur = document.getElementById("messageErreur");
  messageErreur.textContent = message;
  messageErreur.style.display = "block";

  // Optionnel : masquer automatiquement après 3 secondes
  setTimeout(() => {
    messageErreur.style.display = "none";
  }, 3000);
}

  function showConfigForm() {
    configForm.style.display = "block";
    mainContent.style.display = "none";
    baseUrlInput.value = BASE_URL || "";
    apiKeyInput.value = API_KEY || "";
  }

  function showMainContent() {
    configForm.style.display = "none";
    mainContent.style.display = "block";
  }

  editConfigBtn.addEventListener("click", showConfigForm);

  saveBtn.addEventListener("click", () => {
    const baseUrl = baseUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!baseUrl || !apiKey) {
      alert("Merci de remplir les deux champs !");
      return;
    }

    localStorage.setItem("BASE_URL", baseUrl);
    localStorage.setItem("API_KEY", apiKey);
    alert("Configuration enregistrée !");
    location.reload();
  });

  if (!BASE_URL || !API_KEY) {
    showConfigForm();
    return;
  } else {
    showMainContent();
  }

  // --- STATUT PERSO ---
  const addStatusBtn = document.getElementById('addStatusBtn');
  const formContainer = document.getElementById('add-status-form-container');
  const statusForm = document.getElementById('add-status-form');

  addStatusBtn.addEventListener('click', () => {
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
  });
  cancelBtn.addEventListener('click', () => {
  formContainer.style.display = 'none';  // Masque le formulaire
  statusForm.reset(); // Réinitialise les champs
  });

  statusForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = document.getElementById('status-key').value;
    const value = document.getElementById('status-value').value;

    let statusMapping = JSON.parse(localStorage.getItem('statusMapping')) || {};

    if (statusMapping.hasOwnProperty(key)) {
      alert("Cette clé existe déjà !");
      return;
    }

    statusMapping[key] = value;
    localStorage.setItem('statusMapping', JSON.stringify(statusMapping));

    statusForm.reset();
    formContainer.style.display = 'none';
    alert("Statut ajouté !");
  });

  // --- FETCH DES PROJETS ---
  fetch(`${BASE_URL}/projects`, {
    method: "GET",
    headers: {
      "DOLAPIKEY": API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  })
    .then(response => {
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      const list = document.getElementById("project-list");
      list.innerHTML = "";
      data.forEach(project => {
        const item = document.createElement("li");

        const title = document.createElement("strong");
        title.textContent = project.title || "Projet sans nom";
        title.style.cursor = "pointer";
        title.addEventListener("click", () => fetchProjectDetails(project.id));

        const ref = document.createElement("div");
        ref.textContent = "Réf : " + (project.ref || "Aucune");
        ref.style.fontSize = "0.9em";
        ref.style.color = "#555";

        item.appendChild(title);
        item.appendChild(ref);
        list.appendChild(item);
      });
    })
    .catch(error => {
      const list = document.getElementById("project-list");
      list.innerHTML = `<li style="color:red;">Erreur : ${error.message}</li>`;
    });

  function fetchProjectDetails(projectId) {
    fetch(`${BASE_URL}/projects/${projectId}`, {
      method: "GET",
      headers: {
        "DOLAPIKEY": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })
      .then(response => {
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        return response.json();
      })
      .then(project => {
        displayProjectDetails(project);
      })
      .catch(error => {
        alert(`Erreur : ${error.message}`);
      });
  }

  function displayProjectDetails(projectDetails) {
    const startDate = projectDetails.date_c
      ? new Date(projectDetails.date_c * 1000).toLocaleDateString()
      : "Inconnue";

    const defaultMapping = {
      0: "Brouillon",
      1: "Validé",
      2: "Terminé"
    };

    const customMapping = JSON.parse(localStorage.getItem('statusMapping')) || {};
    const statusMapping = { ...defaultMapping, ...customMapping };

    const projectStatus = parseInt(projectDetails.status, 10);
    const statusText = statusMapping[projectStatus] || "Inconnu";

    const detailsContainer = document.getElementById("project-details");
    detailsContainer.innerHTML = `
      <h3>Détails du projet</h3>
      <p><strong>Réf. :</strong> ${projectDetails.ref || "Aucune"}</p>
      <p><strong>Titre :</strong> ${projectDetails.title || "Aucune"}</p>
      <p><strong>Usage :</strong> ${projectDetails.usage_opportunity || "Non définie"}</p>
      <p><strong>Tierce partie :</strong> ${projectDetails.entity || "Aucune"}</p>
      <p><strong>Statut opportunité :</strong> ${projectDetails.opp_status || "Inconnu"}</p>
      <p><strong>Statut du projet :</strong> ${statusText}</p>
      <p><strong>Montant opportunité :</strong> ${projectDetails.opp_amount || "Non défini"} €</p>
      <p><strong>Budget :</strong> ${projectDetails.budget_amount || "Non défini"} €</p>
      <p><strong>Date :</strong> ${startDate}</p>
      <p><strong>Description :</strong> ${projectDetails.description || "Aucune description disponible"}</p>
    `;
    projectDetails.statusText = statusText;
    // Affiche le bouton pour remplir un formulaire
    fillFormButton.style.display = "inline-block";
    // Stocke le projet en cours (utile pour le bouton)
    fillFormButton.currentProject = projectDetails;
  }
   //  d’écouteur pour le bouton remplir un formulaire
   /*fillFormButton.addEventListener("click", () => {
    const project = fillFormButton.currentProject;

    if (!project) return;
    const params = new URLSearchParams({
    firstname: project.title || "",
    lastname: project.statusText,
    zip: project.opp_status || "",
    address: project.ref || "",
    phone: project.budget_amount || ""
  });
    //déclenche la fonction pour remplir le formulaire de Iouston
     console.log("Remplir formulaire avec le projet :", project);
     // Redirige vers le formulaire avec les données dans l’URL
     //console.log("Ouverture fenêtre");
   const pageElement = document.getElementById("page");
  if (!pageElement) {
    console.error("L'élément #page est introuvable");
    return;
  }

  const currentUrl = pageElement.textContent.trim(); // récupère l'URL ou texte dans #page

  if (currentUrl.includes("iouston.com/contact-2")) {
    remplirFormulaireIouston();
  } else if (currentUrl.includes("inedis.com")) {
    remplirFormulaireInedis();
  } else {
    console.log("Aucune fonction spécifique pour cette URL :", currentUrl);
  }
});*/
  /*fillFormButton.addEventListener("click", () => {
  const project = fillFormButton.currentProject;
  if (!project) return;

  const pageElement = document.getElementById("page");
  if (!pageElement) {
    console.error("L'élément #page est introuvable");
    return;
  }

  const currentUrl = pageElement.textContent.trim();

  if (currentUrl.includes("iouston.com/contact-2") || currentUrl.includes("inedis.com")) {
    // Trouver l’onglet qui correspond à currentUrl
    browser.tabs.query({ url: `*://${new URL(currentUrl).hostname}/*` }).then(tabs => {
      if (tabs.length === 0) {
        console.error("Aucun onglet ne correspond à cette URL :", currentUrl);
        return;
      }
      const tabActif = tabs[0];

      let actionToSend = "";
      if (currentUrl.includes("iouston.com/contact-2")) {
        actionToSend = "remplirFormulaireIouston";
      } else if (currentUrl.includes("inedis.com")) {
        actionToSend = "remplirFormulaireInedis";
      } else {
          console.error("Cette extension ne prend pas encore en charge ce site :", currentUrl);
            if (messageErreur) {
              messageErreur.textContent = "Ce site n’est pas encore pris en charge par l’extension.";
               messageErreur.style.display = "block";
              }
             return;
            }

      browser.tabs.sendMessage(tabActif.id, {
        action: actionToSend,
        data: {
          firstname: project.title || "",
          lastname: project.statusText,
          zip: project.opp_status || "",
          address: project.ref || "",
          phone: project.budget_amount || ""
        }
      });
    });
  } else {
    console.log("Aucune fonction spécifique pour cette URL :", currentUrl);
  }
});*/
  fillFormButton.addEventListener("click", () => {
  const project = fillFormButton.currentProject;
  if (!project) return;

  const pageElement = document.getElementById("page");
  if (!pageElement) {
    console.error("L'élément #page est introuvable");
    return;
  }

  const currentUrl = pageElement.textContent.trim();
  const profilsUrl = {
  1:"https://www.iouston.com/contact-2/",
  2:"https://www.enedis.fr/",
  3:"edf.fr"
  };
  let currentkey;

// Trouver la clé correspondant à currentURL
const entry = Object.entries(profilsUrl).find(([key, url]) => url === currentUrl);
if (entry) {
  const [key, url] = entry;
  console.log(`URL trouvée avec la clé : ${key}`);
  currentkey=key;
} else {
  console.log("URL non trouvée dans profilsUrl");
}
  
const mapping = {
  1: {
    firstname: "project.title",
    lastname: "project.statusText",
    zip: "project.opp_status",
    address: "project.ref",
    phone: "project.budget_amount"
  },
  2: {
    champ3: "champdolibarr3",
    champ4: "champdolibarr4"
  }
};

console.log(mapping[currentkey]);


// Récupérer le tableau de mapping depuis localstorage
//const mappingJSON = localStorage.getItem('mapping');




  if (currentUrl.includes("iouston.com/contact-2")) {
    browser.tabs.query({ url: `*://${new URL(currentUrl).hostname}/*` }).then(tabs => {
      if (tabs.length === 0) {
        console.error("Aucun onglet ne correspond à cette URL :", currentUrl);
        return;
      }
      const tabActif = tabs[0];
      let actionToSend = currentUrl.includes("iouston.com/contact-2") ? "remplirFormulaireIouston" : "remplirFormulaireInedis";

      browser.tabs.sendMessage(tabActif.id, {
        action: actionToSend,
        data: {
          firstname: project.title || "",
          lastname: project.statusText,
          zip: project.opp_status || "",
          address: project.ref || "",
          phone: project.budget_amount || ""
        }
      });
    });
  } else {
    console.error("Cette extension ne prend pas encore en charge ce site :", currentUrl);
    showErrorMessage("cette url n'est pas prise en charge !");
  }
});
});
  