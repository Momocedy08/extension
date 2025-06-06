  document.addEventListener("DOMContentLoaded", async () => {
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
  const urlConfigBtn = document.getElementById("url_config");
  const menuConfig = document.getElementById("menu_config");
  const API_KEY = localStorage.getItem("API_KEY");
  const entityInput = document.getElementById("entityInput");

  //masquer le bouton d'entrer des entité 
  const entityLabel = entityInput.closest("label");
  if (entityLabel) {
  entityLabel.style.display = "none"; // On cache au départ
  }

 function showErrorMessage(message) {
  const messageErreur = document.getElementById("messageErreur");
  console.log("showErrorMessage appelé avec :", message);
  console.log("messageErreur element:", messageErreur);

  if (!messageErreur) {
    console.error("L'élément #messageErreur est introuvable dans le DOM !");
    return;
  }

  messageErreur.textContent = message;
  messageErreur.style.display = "block";

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
//************************************************************************
  saveBtn.addEventListener("click", async () => {
  const baseUrl = baseUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const entity = document.getElementById("entityInput").value.trim();

  if (!baseUrl || !apiKey) {
    alert("Merci de remplir les deux champs !");
    return;
  }

  // On sauvegarde l'URL et la clé API
  localStorage.setItem("BASE_URL", baseUrl);
  localStorage.setItem("API_KEY", apiKey);

  const isEnabled = await isMultiCompanyModuleEnabledWith(baseUrl, apiKey);
  const entityLabel = document.getElementById("entityInput")?.closest("label");

  if (isEnabled) {
    if (entityLabel) {
      entityLabel.style.display = "block";
    }

    // Si l'entité n'est pas encore renseignée, on attend
    if (!entity) {
      alert("Veuillez entrer l'entité, puis cliquez à nouveau sur Enregistrer.");
      return;
    }
    // On Teste si l'entité est valide
    const isValidEntity = await testEntityIsValid(baseUrl, apiKey, entity);
    console.log("Validation entité...", isValidEntity);
    if (!isValidEntity) {
      console.log("Entity non valide détectée !");
    showErrorMessage("Cette entité n'existe pas ou vous n'avez pas les droits !");
    const list = document.getElementById("project-list");
    list.innerHTML = `<li style="color:red;">Impossible de charger les projets.</li>`;
    return; // On ne fetch pas les projets si l'entité n'est pas valide
}

    // On sauvegarde l'entité pour s'en servir plus tard
    localStorage.setItem("ENTITY", entity);
  }

  alert("Configuration enregistrée !");
  location.reload(); // ou fetchProjectDetails() si tu préfères charger sans reload
});
//********************************************************************************
  if (!BASE_URL || !API_KEY) {
    showConfigForm();
    return;
  } else {
    showMainContent();
    urlConfigBtn.style.display = "block";
  }
  testMultiCompanyModule();//affichage de l'entrer
  //*************************************************************************
    // Toggle menu URLs
  urlConfigBtn.addEventListener("click", () => {
    menuConfig.style.display = menuConfig.style.display === "none" ? "block" : "none";
  });
  // Placeholder : afficher/ajouter URL
  document.getElementById("btn_afficher_urls").addEventListener("click", () => {
    alert("Fonction à implémenter : afficher les URLs enregistrées.");
  });

  document.getElementById("btn_ajouter_url").addEventListener("click", () => {
    alert("Fonction à implémenter : formulaire pour ajouter une nouvelle URL et son mapping.");
  });
  // Si la config est complète, on affiche le bouton de config URL
  //*****************************************************************************
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
  // Bouton "Retour au projet"
  document.getElementById("backToProjectBtn").addEventListener("click", () => {
    const lastState = history.state;
    if (lastState && lastState.project) {
      displayProjectDetails(lastState.project);
      document.getElementById("backToProjectBtn").style.display = "none";
    }
  });
  // --- FETCH DES PROJETS ---
async function fetchProjectsIfEntityValid() {
  const entity = localStorage.getItem("ENTITY");
  console.log("🔄 fetchProjectsIfEntityValid: ENTITY =", entity);

  const isEnabled = await isMultiCompanyModuleEnabledWith(BASE_URL, API_KEY);
  console.log("🔎 isMultiCompanyModuleEnabledWith =", isEnabled);

  if (isEnabled) {
    const isValidEntity = await testEntityIsValid(BASE_URL, API_KEY, entity);
    console.log("✅ Résultat de testEntityIsValid =", isValidEntity);

    if (!isValidEntity) {
      showErrorMessage("Cette entité n'existe pas ou vous n'avez pas les droits !");
      return; // Ne pas fetch les projets si entité invalide
    }
  }

  // fetch des projets avec DOLAPIENTITY
  const headers = await getHeaders();
  console.log("🚀 Lancement du fetch des projets");

  fetch(`${BASE_URL}/projects?DOLAPIENTITY=${entity}`, {
    method: "GET",
    headers
  })
  .then(response => {
    console.log("↩️ Réponse fetch projects status =", response.status);

    if (response.status === 401) {
      showErrorMessage("Vous n'avez pas les droits sur cette entité !");
      throw new Error(`Erreur HTTP 401`);
    }

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
    console.error("💥 Erreur dans fetch projects :", error);
  });
}
await fetchProjectsIfEntityValid();

  async function fetchProjectDetails(projectId) {
    const headers = await getHeaders();
fetch(`${BASE_URL}/projects/${projectId}`, {
  method: "GET",
  headers
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
  //le nom du thirdparty
   async function fetchThirdpartyName(id) {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/thirdparties/${id}`, {
  method: "GET",
  headers
});
    const data = await response.json();
    return data.name || "Inconnu";
  } catch (error) {
    console.error("Erreur récupération tiers :", error);
    return "Erreur de chargement";
  }
}
//*******************************************************
  async function isMultiCompanyModuleEnabledWith(baseUrl, apiKey) {
  try {
    const response = await fetch(`${baseUrl}/setup/modules`, {
      headers: {
        "DOLAPIKEY": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      console.error("Erreur HTTP lors de la vérification des modules :", response.status, response.statusText);
      return false;
    }

    const modules = await response.json();
    return modules.includes("multicompany");
  } catch (error) {
    console.error("Erreur dans la vérification du module multisociété :", error);
    return false;
  }
}
//**************************************************************
async function testMultiCompanyModule() {
  const isEnabled = await isMultiCompanyModuleEnabledWith(BASE_URL, API_KEY);

  const entityLabel = document.getElementById("entityInput")?.closest("label");
  
  if (isEnabled && entityLabel) {
    console.log("✅ Le module Multisociété est activé.");
    entityLabel.style.display = "block"; // Affiche le champ
  } else {
    console.log("❌ Le module Multisociété n'est PAS activé.");
  }
}
//fonction pour voir si l'entité existe ou pas 
async function testEntityIsValid(baseUrl, apiKey, entity) {
  console.log("➡️ testEntityIsValid appelé avec entity =", entity);
  const headers = {
    "DOLAPIKEY": apiKey,
    "Content-Type": "application/json"
  };

  try {
    const url = `${baseUrl}/projects?limit=1&DOLAPIENTITY=${entity}`;
    console.log("🔍 Fetch vers URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers
    });

    console.log("↩️ Réponse reçue avec status:", response.status);

    if (response.status === 404) {
      console.warn("⚠️ Entity non valide (404)");
      return false; // entité non valide
    }

    if (!response.ok) {
      console.error("❌ Réponse non OK dans testEntityIsValid:", response.status);
      return false;
    }

    console.log("✅ Entity valide");
    return true; // entité valide
  } catch (error) {
    console.error("💥 Erreur réseau dans testEntityIsValid:", error);
    return false; // en cas d'erreur réseau, on considère que l'entité n'est pas valide
  }
}
// Fonction utilitaire pour centraliser les headers (incluant éventuellement l'entité)
async function getHeaders() {
  const headers = {
    "DOLAPIKEY": localStorage.getItem("API_KEY"),
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  const entity = localStorage.getItem("ENTITY");
  if (entity) {
    headers["DOLAPIENTITY"] = entity;
  }
  return headers;
}

//************************************************************************
//fonction de recuperation des données de la compagnie dolibarr
async function fetchCompanyDetails() {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/setup/company`, {
  method: "GET",
  headers
});
    const responseText = await response.text();
    if (!response.ok) {
      console.error("Erreur HTTP :", response.status, response.statusText);
      return null;
    }

    const data = JSON.parse(responseText);
    return data;

  } catch (error) {
    console.error("Erreur dans fetchCompanyDetails :", error);
    return null;
  }
}
//fonction de recuperation des infos detaillés du tiers
async function fetchThirdpartyDetails(id) {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/thirdparties/${id}`, {
  method: "GET",
  headers
});
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur récupération détails tiers :", error);
    return null;
  }
}

  async function displayProjectDetails(projectDetails) {
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
   //Récupération des noms via API
  console.log("Entity ID du projet :", projectDetails.entity);
  const tiersName = await fetchThirdpartyName(projectDetails.socid);
  //le nom de la compagnie
  const compagnie = await fetchCompanyDetails();
  console.log("ProjectDetails complet : ", projectDetails);
  let extrafieldsHtml = "";
  const extrafields = projectDetails.array_options || {};
  for (const [key, value] of Object.entries(extrafields)) {
    const fieldName = key.replace("options_", "");
    extrafieldsHtml += `<p><strong>${fieldName} :</strong> ${value || "Non défini"}</p>`;
  }
  detailsContainer.innerHTML = `
    <h3>Détails du projet</h3>
    <p><strong>Réf. :</strong> ${projectDetails.ref || "Aucune"}</p>
    <p><strong>Titre :</strong> ${projectDetails.title || "Aucune"}</p>
    <p><strong>Entité :</strong> <a href="#" id="company-link">${compagnie.name || "Non définie"}</a></p>
    <p><strong>Tierce partie :</strong> <a href="#" id="tier-link">${tiersName || "Non définie"}</a></p>
    <p><strong>Statut opportunité :</strong> ${projectDetails.opp_status || "Inconnu"}</p>
    <p><strong>Statut du projet :</strong> ${statusText}</p>
    <p><strong>Montant opportunité :</strong> ${projectDetails.opp_amount || "Non défini"} €</p>
    <p><strong>Budget :</strong> ${projectDetails.budget_amount || "Non défini"} €</p>
    <p><strong>Date :</strong> ${startDate}</p>
    <p><strong>Description :</strong> ${projectDetails.description || "Aucune description disponible"}</p>
    ${extrafieldsHtml || ""}
  `;
  console.log(projectDetails);
  projectDetails.statusText = statusText;

  fillFormButton.style.display = "inline-block";
  fillFormButton.currentProject = projectDetails;
  //gérer le clic pour afficher les détails du tiers
  document.getElementById("tier-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const thirdparty = await fetchThirdpartyDetails(projectDetails.socid);
  if (thirdparty) {
    history.pushState({ project: projectDetails }, "", "tiers");
    displayThirdpartyDetails(thirdparty);
    document.getElementById("backToProjectBtn").style.display = "inline-block";
  }
});
  // Gérer le clic pour afficher les détails de la compagnie
document.getElementById("company-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const company = await fetchCompanyDetails(); // <-- à créer comme fetchCompanyName mais retourne tout
  if (company) {
    history.pushState({ project: projectDetails }, "", "company");
    displayCompanyDetails(company); // <-- à créer comme displayThirdpartyDetails
    document.getElementById("backToProjectBtn").style.display = "inline-block";
  }
});
}
//afficher les details du tier
  function displayThirdpartyDetails(tiers) {
  const container = document.getElementById("project-details");
  container.innerHTML = `
    <h3>Détails du tiers</h3>
    <p><strong>Nom :</strong> ${tiers.name || "Non défini"}</p>
    <p><strong>Adresse :</strong> ${tiers.address || "Non définie"}</p>
    <p><strong>Code postal :</strong> ${tiers.zip || ""} ${tiers.town || ""}</p>
    <p><strong>Pays :</strong> ${tiers.country?.label || "Non défini"}</p>
    <p><strong>Email :</strong> ${tiers.email || "Non défini"}</p>
    <p><strong>Téléphone :</strong> ${tiers.phone || "Non défini"}</p>
  `;
}
//afficher les details de la compagnie
function displayCompanyDetails(company) {
  const container = document.getElementById("project-details");
  container.innerHTML = `
    <h3>Détails de la société</h3>
    <p><strong>Nom :</strong> ${company.name || "Non défini"}</p>
    <p><strong>Adresse :</strong> ${company.address || "Non définie"}</p>
    <p><strong>Téléphone :</strong> ${company.phone || "Non défini"}</p>
    <p><strong>Email :</strong> ${company.email || "Non défini"}</p>
    <p><strong>Managers :</strong> ${company.managers || "Non défini"}</p>
    <p><strong>Capital :</strong> ${company.capital || "Non défini"} €</p>
    <p><strong>SIRET :</strong> ${company.idprof2 || "Non défini"}</p>
  `;
}
   //  d’écouteur pour le bouton remplir un formulaire
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
  2:"https://s-t-v.fr/",
  3:"https://www.edf.fr/",
  };
  let currentkey;
  let pageok;

// Trouver la clé correspondant à currentURL
const entry = Object.entries(profilsUrl).find(([key, url]) => url === currentUrl);
if (entry) {
  const [key, url] = entry;
  console.log(`URL trouvée avec la clé : ${key}`);
  currentkey=key;
  pageok=1;
} else {
  pageok=0;
  console.log("URL non trouvée dans profilsUrl");
}
  
const mapping = {
  1: {
    "input_1.3": "project.title",
    "input_1.6": "project.statusText",
    "input_3.5": "project.opp_status",
    "input_3.1": "project.ref",
    "input_4": "project.budget_amount"
  },
  2: {
    "nom": "project.title",
    "message": "project.ref"
  }
};
// Récupérer le tableau de mapping depuis localstorage
//const mappingJSON = localStorage.getItem('mapping');
  if (pageok==1) {
    browser.tabs.query({ url: `*://${new URL(currentUrl).hostname}/*` }).then(tabs => {
      if (tabs.length === 0) {
        console.error("Aucun onglet ne correspond à cette URL :", currentUrl);
        return;
      }
      const tabActif = tabs[0];
      let actionToSend = "remplirFormulaire";

      //On parse les champs pour écrire dynamiquement les données à envoyer au formulaire
      const nosdata = {};
      const map = mapping[currentkey];

      for (const champFormulaire in map) {
        const champDolibarr = map[champFormulaire];
        nosdata[champFormulaire] = champDolibarr || "";
      }
      console.log("Projet envoyé :", project);
      console.log("project.title =", project.title); // devrait afficher "test"
      console.log("project.ref =", project.ref); 
      browser.tabs.sendMessage(tabActif.id, {
        action: actionToSend,
         data: nosdata,
         project:project
      });
    });
  } else {
    console.error("Cette extension ne prend pas encore en charge ce site :", currentUrl);
    showErrorMessage("cette url n'est pas prise en charge !");
  }
});
});
  