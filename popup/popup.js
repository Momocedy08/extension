  document.addEventListener("DOMContentLoaded", async () => {
  //--- CONFIGURATION ---
  const configForm = document.getElementById("config-form");
  const mainContent = document.getElementById("main-content");
  const saveBtn = document.getElementById("saveBtn");
  const editConfigBtn = document.getElementById("editConfigBtn");
  const baseUrlInput = document.getElementById("baseUrl");
  const apiKeyInput = document.getElementById("apiKey");
  const cancelBtn = document.getElementById('cancelStatusBtn');
  const fillFormButton = document.getElementById("fillFormButton");
  const BASE_URL = await browser.storage.local.get("BASE_URL").then(res => res.BASE_URL || "");  
  const API_KEY = await browser.storage.local.get("API_KEY").then(res => res.API_KEY || "");
  const entityInput = document.getElementById("entityInput");
  const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
  const modifyConfigBlock = document.getElementById("modify-config");
  

  toggleSettingsBtn.addEventListener("click", () => {
    if (modifyConfigBlock.style.display === "none") {
      modifyConfigBlock.style.display = "flex";
    } else {
      modifyConfigBlock.style.display = "none";
    }
  });

  //masquer le bouton d'entrer des entité 
  const entityLabel = entityInput.closest("label");
  if (entityLabel) {
  entityLabel.style.display = "none"; // On cache au départ
  }
 function showErrorMessage(message) {
  const messageErreur = document.getElementById("messageErreur");
  if (!messageErreur) {
    console.error("L'élément #messageErreur est introuvable dans le DOM !");
    return;
  }
  messageErreur.textContent = message;
  messageErreur.style.display = "block";
  setTimeout(() => {
    messageErreur.style.display = "none";
  }, 6000);
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
  saveBtn.addEventListener("click", async () => {
  const baseUrl = baseUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const entity = document.getElementById("entityInput").value.trim();
  if (!baseUrl || !apiKey) {
    alert("Merci de remplir les deux champs !");
    return;
  }
  //On sauvegarde l'URL et la clé API
  browser.storage.local.set({ BASE_URL: baseUrl });  
  browser.storage.local.set({ API_KEY: apiKey });
  const isEnabled = await isMultiCompanyModuleEnabledWith(baseUrl, apiKey);
  const entityLabel = document.getElementById("entityInput")?.closest("label");
  if (isEnabled) {
    if (entityLabel) {
      entityLabel.style.display = "block";
    }
    //Si l'entité n'est pas encore renseignée, on attend
    if (!entity) {
      alert("Veuillez entrer l'entité, puis cliquez à nouveau sur Enregistrer.");
      return;
    }
    //On Teste si l'entité est valide
    const isValidEntity = await testEntityIsValid(baseUrl, apiKey, entity);
    if (!isValidEntity) {
    showErrorMessage("Cette entité n'existe pas ou vous n'avez pas les droits !");
    const list = document.getElementById("project-list");
    list.innerHTML = `<li style="color:red;">Impossible de charger les projets.</li>`;
    return; // On ne fetch pas les projets si l'entité n'est pas valide
}
    //On sauvegarde l'entité pour s'en servir plus tard
   browser.storage.local.set({ ENTITY: entity });
  }
  alert("Configuration enregistrée !");
  location.reload();
});
  if (!BASE_URL || !API_KEY) {
    showConfigForm();
    return;
  } else {
    showMainContent();
  }
  testMultiCompanyModule();//affichage de l'entrer
//fonction pour gerer l'affichage des boutons
  async function gererAffichageBoutons() {
  const pageElement = document.getElementById("page");
  if (!pageElement) {
    console.warn("Élément #page non trouvé");
    return;
  }
  const currentUrl = pageElement.textContent.trim();
  const { BASE_URL, API_KEY, profilsUrl: savedProfils } = await browser.storage.local.get(["BASE_URL", "API_KEY", "profilsUrl"]);

// Valeurs par défaut si profils absents
let profils = savedProfils;
if (!profils || Object.keys(profils).length === 0) {
  profils = {
   
  };
  await browser.storage.local.set({ profilsUrl: profils }); // Sauvegarde pour la suite
}
  const isConfigured = BASE_URL && API_KEY;
  const urlExists = Object.values(profils).includes(currentUrl);

  const btnAjouter = document.getElementById("btn_ajouter_urls");
  const btnModifier = document.getElementById("btn_modifier_urls");
  const btnSupprimer = document.getElementById("btn_supprimer_urls");

  if (!btnAjouter || !btnModifier || !btnSupprimer) {
    console.error("Un ou plusieurs boutons sont introuvables dans le DOM !");
    return;
  }
  // Réinitialiser l'affichage
  btnAjouter.style.display = "none";
  btnModifier.style.display = "none";
  btnSupprimer.style.display = "none";
  if (urlExists) {
    btnModifier.style.display = "inline-block";
    btnSupprimer.style.display = "inline-block";

btnModifier.onclick = async () => {
  const pageElement = document.getElementById("page");
  const currentUrl = pageElement?.textContent.trim();
  if (!currentUrl) {
    alert("Impossible de récupérer l'URL actuelle");
    return;
  }

  const profilsUrl = await browser.storage.local.get("profilsUrl").then(res => res.profilsUrl || {});
  const mappings = await browser.storage.local.get("mappings").then(res => res.mappings || {});
  const urlKeyEntry = Object.entries(profilsUrl).find(([_, url]) => url === currentUrl);
  const key = urlKeyEntry?.[0];

  if (!key || !mappings[key]) {
    alert("Aucun mapping existant pour cette URL");
    return;
  }

  const mapping = mappings[key];
  const dolibarrData = await getAvailableFields(); // récupère projets, tiers, companies
  const dolibarrFields = getDolibarrFieldsFromData(dolibarrData); // transforme pour liste déroulante

  showEditMappingForm(currentUrl, mapping, dolibarrFields, key); // affiche formulaire d'édition
};
   btnSupprimer.onclick = async () => {
  const confirmation = confirm("Êtes-vous sûr de vouloir supprimer cette URL et son mapping associé ?");
  if (!confirmation) return;

  const pageElement = document.getElementById("page");
  const currentUrl = pageElement?.textContent.trim();

  if (!currentUrl) {
    alert("URL non détectée.");
    return;
  }

  const { profilsUrl, mappings } = await browser.storage.local.get(["profilsUrl", "mappings"]);

  // Trouver la clé de l’URL à supprimer
  const urlEntry = Object.entries(profilsUrl || {}).find(([_, url]) => url === currentUrl);

  if (!urlEntry) {
    alert("Cette URL n'est pas enregistrée.");
    return;
  }

  const [keyToDelete] = urlEntry;

  // Supprimer de profilsUrl
  delete profilsUrl[keyToDelete];

  // Supprimer du mapping
  if (mappings && mappings[keyToDelete]) {
    delete mappings[keyToDelete];
  }

  // Sauvegarder les changements
  await browser.storage.local.set({ profilsUrl, mappings });

  alert("URL et mapping supprimés avec succès !");
  // Recharger les boutons
  gererAffichageBoutons();
};

  } else if (isConfigured) {
    btnAjouter.style.display = "inline-block";
  }
}
  function showEditMappingForm(url, mapping, dolibarrFields, mappingKey) {
  if (document.getElementById("edit-url-form")) return;

  // Masquer les autres éléments
  document.body.querySelectorAll("body > *:not(script)").forEach(el => {
    if (el.id !== "edit-url-form") el.style.display = "none";
  });

  const formContainer = document.createElement("div");
  formContainer.id = "edit-url-form";
  formContainer.classList.add("form-mapping-container");

  const urlLabel = document.createElement("label");
  urlLabel.classList.add("url-label");
  urlLabel.textContent = "URL : " + url;
  formContainer.appendChild(urlLabel);

  const headerRow = document.createElement("div");
  headerRow.classList.add("mapping-row");

  const labelForm = document.createElement("div");
  labelForm.textContent = "Champs du formulaire (détectés)";
  labelForm.style.fontWeight = "bold";
  labelForm.style.flex = "1";

  const labelDolibarr = document.createElement("div");
  labelDolibarr.textContent = "Champs Dolibarr (modifiables)";
  labelDolibarr.style.fontWeight = "bold";
  labelDolibarr.style.flex = "1";

  headerRow.appendChild(labelForm);
  headerRow.appendChild(labelDolibarr);
  formContainer.appendChild(headerRow);

  // Boucle sur les champs mappés uniquement
  Object.entries(mapping).forEach(([formField, dolibarrField]) => {
    const row = document.createElement("div");
    row.classList.add("mapping-row");

    // Partie champ formulaire HTML (lecture seule)
    const inputForm = document.createElement("input");
    inputForm.type = "text";
    inputForm.classList.add("input-form");
    inputForm.value = formField;
    inputForm.readOnly = true;
    inputForm.style.flex = "1";
    inputForm.style.marginRight = "10px";

    // Partie champ Dolibarr (modifiable)
    const selectDolibarr = document.createElement("select");
    selectDolibarr.classList.add("select-dolibarr");
    selectDolibarr.style.flex = "1";

    selectDolibarr.innerHTML = `<option value="">-- Champ Dolibarr --</option>`;
    dolibarrFields.forEach(field => {
      const option = document.createElement("option");
      option.value = field.value;
      option.textContent = field.label;
      if (field.value === dolibarrField) {
        option.selected = true;
      }
      selectDolibarr.appendChild(option);
    });

    row.appendChild(inputForm);
    row.appendChild(selectDolibarr);
    formContainer.appendChild(row);
  });

  // Bouton Enregistrer les modifications
  const saveButton = document.createElement("button");
  saveButton.textContent = "Enregistrer les modifications";
  saveButton.classList.add("btn-save-mapping");
  saveButton.addEventListener("click", async () => {
    const updatedMapping = {};
    document.querySelectorAll(".mapping-row").forEach(row => {
      const input = row.querySelector(".input-form");
      const select = row.querySelector(".select-dolibarr");

      const formField = input?.value.trim();
      const dolibarrVal = select?.value.trim();

      if (formField && dolibarrVal) {
        updatedMapping[formField] = dolibarrVal;
      }
    });

    const store = await browser.storage.local.get("mappings");
    const allMappings = store.mappings || {};
    allMappings[mappingKey] = updatedMapping;

    await browser.storage.local.set({ mappings: allMappings });
    alert("Mapping mis à jour avec succès !");
    formContainer.remove();
document.body.querySelectorAll("body > *:not(script)").forEach(el => {
  if (el.id !== "add-url-form") el.style.display = "";
});

  });
  formContainer.appendChild(saveButton);

  // Bouton Retour
  const backButton = document.createElement("button");
  backButton.textContent = "Retour";
  backButton.classList.add("btn-retour-formulaire");
  backButton.addEventListener("click", () => {
    formContainer.remove();
    document.body.querySelectorAll("body > *:not(script)").forEach(el => {
      if (el.id !== "edit-url-form") el.style.display = "";
    });
  });
  formContainer.appendChild(backButton);

  document.body.appendChild(formContainer);
}
//*****************************************************************************************************************
async function fetchExtraFieldsById(endpoint, id, entity) {
  const url = `${BASE_URL}/${endpoint}/${id}?DOLAPIENTITY=${entity}`;
  const headers = {
    "DOLAPIKEY": API_KEY,
    "Accept": "application/json"
  };

  try {
    const response = await fetch(url, { headers });
    const text = await response.text();
    console.log(`Réponse brute de /${endpoint}/${id} :`, text);
    const data = JSON.parse(text);
    return data.array_options || {};
  } catch (error) {
    console.error(`Erreur lors de la récupération des champs supplémentaires pour ${endpoint}/${id} :`, error);
    return {};
  }
}
function getDolibarrFieldsFromData({ project, tiers, company }) {
  const result = [];

  const addFields = (obj, prefix) => {
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      if (key === "array_options" && typeof obj[key] === "object") {
        const extraFields = obj[key];
        console.log(`${prefix} - array_options:`, extraFields);
        for (const extraKey in extraFields) {
          result.push({
            label: `${prefix} - ExtraField - ${extraKey.replace(/^options_/, "")}`,
            value: `${prefix.toLowerCase()}.array_options.${extraKey}`
          });
        }
      } else {
        result.push({
          label: `${prefix} - ${key}`,
          value: `${prefix.toLowerCase()}.${key}`
        });
      }
    }
  };

  addFields(project || {}, "Project");
  addFields(tiers || {}, "Tiers");
  addFields(company || {}, "Company");

  return result;
}


async function getAvailableFields() {
  const entity = await browser.storage.local.get("ENTITY").then(res => res.ENTITY || "");
  const headers = await getHeaders();

  // Récupération d’un projet
  const resProjects = await fetch(`${BASE_URL}/projects?limit=1&DOLAPIENTITY=${entity}`, { headers });
  const rawProject = await resProjects.text();
  console.log("Réponse brute de /projects :", rawProject);

  let sampleProject;
  try {
    sampleProject = JSON.parse(rawProject);
  } catch (e) {
    console.error("Erreur parsing JSON /projects :", e);
    return { project: {}, tiers: {}, company: {} };
  }

  const project = sampleProject?.[0] || {};

  // Récupération d’un tiers
  const resTiers = await fetch(`${BASE_URL}/thirdparties?limit=1&DOLAPIENTITY=${entity}`, { headers });
  const rawText = await resTiers.text();
  console.log("Réponse brute de /thirdparties :", rawText);

  let sampleTiers;
  try {
    sampleTiers = JSON.parse(rawText);
  } catch (e) {
    console.error("Erreur lors du parsing JSON /thirdparties :", e);
    return { project: {}, tiers: {}, company: {} };
  }

  const tiers = sampleTiers?.[0] || {};

  // Vérification des IDs
  const projectId = project?.id;
  const tierId = tiers?.id;

  if (!projectId || !tierId) {
    console.error("ID projet ou tiers manquant");
    return { project: {}, tiers: {}, company: {} };
  }

  // Récupération de la compagnie
  const resCompany = await fetch(`${BASE_URL}/setup/company`, { headers });
  const company = await resCompany.json();

  // Récupération des extra fields
  const projectExtra = await fetchExtraFieldsById("projects", projectId, entity);
  const tiersExtra = await fetchExtraFieldsById("thirdparties", tierId, entity);
  const companyExtra = await fetchCompanyExtraFieldsFromMulticompany(entity); // spécifique

  console.log("Project array_options :", projectExtra);
  console.log("Tiers array_options :", tiersExtra);
  console.log("Company array_options :", companyExtra);

  // Injection dans les objets
  project.array_options = projectExtra;
  tiers.array_options = tiersExtra;
  company.array_options = companyExtra;

  console.log("Project final :", project);
  console.log("Tiers final :", tiers);
  console.log("Company final :", company);

  return { project, tiers, company };
}



 gererAffichageBoutons();
function showAddUrlForm(url, fields = [], dolibarrFields = []) {
   console.log("fields reçus :", fields);
   console.log("champs Dolibarr disponibles :", dolibarrFields);

  // Masquer tous les autres éléments sauf le formulaire
  document.body.querySelectorAll("body > *:not(script)").forEach(el => {
    if (el.id !== "add-url-form") el.style.display = "none";
  });
  // Ne pas recréer si déjà présent
  if (document.getElementById("add-url-form")) return;
  // Conteneur principal
  const formContainer = document.createElement("div");
  formContainer.id = "add-url-form";
  formContainer.classList.add("form-mapping-container");

  // Label avec l'URL
  const urlLabel = document.createElement("label");
  urlLabel.classList.add("url-label");
  urlLabel.textContent = "URL détectée : " + url;
  formContainer.appendChild(urlLabel);

  //Ligne d'en-tête : labels de colonnes
  const headerRow = document.createElement("div");
  headerRow.classList.add("mapping-row");

  const labelForm = document.createElement("div");
  labelForm.textContent = "Champs du formulaire";
  labelForm.style.fontWeight = "bold";
  labelForm.style.flex = "1";

  const labelDolibarr = document.createElement("div");
  labelDolibarr.textContent = "Champs Dolibarr";
  labelDolibarr.style.fontWeight = "bold";
  labelDolibarr.style.flex = "1";

  headerRow.appendChild(labelForm);
  headerRow.appendChild(labelDolibarr);
  formContainer.appendChild(headerRow);

  // Lignes de mapping dynamique
fields.forEach(field => {
  const mappingRow = document.createElement("div");
  mappingRow.classList.add("mapping-row");

  // Conteneur du champ détecté (input + hint)
  const inputContainer = document.createElement("div");
  inputContainer.style.display = "flex";
  inputContainer.style.flexDirection = "column";
  inputContainer.style.flex = "1";
  inputContainer.style.marginRight = "10px"; // un peu d'espace à droite

  // Champ détecté (non modifiable)
  const inputFormField = document.createElement("input");
  inputFormField.type = "text";
  inputFormField.placeholder = "Champ détecté";
  inputFormField.classList.add("input-form");
  inputFormField.value = field.name || field.id || "";
  inputFormField.readOnly = true;

  inputContainer.appendChild(inputFormField);

  // Affichage des valeurs possibles si elles existent
  if (Array.isArray(field.possibleValues) && field.possibleValues.length > 0) {
    const hint = document.createElement("div");
    hint.classList.add("possible-values-hint");
    hint.textContent = "Valeurs possibles : " + field.possibleValues.join(", ");
    inputContainer.appendChild(hint);
  }

  // Select Dolibarr
  const dolibarrSelect = document.createElement("select");
  dolibarrSelect.classList.add("select-dolibarr");
  dolibarrSelect.style.flex = "1";
  dolibarrSelect.innerHTML = `<option value="">-- Champ Dolibarr --</option>`;
  dolibarrFields.forEach(dField => {
    const option = document.createElement("option");
    option.value = dField.value;
    option.textContent = dField.label;
    dolibarrSelect.appendChild(option);
  });

  mappingRow.appendChild(inputContainer);
  mappingRow.appendChild(dolibarrSelect);

  formContainer.appendChild(mappingRow);
});


  // Bouton Enregistrer
  const saveButton = document.createElement("button");
  saveButton.textContent = "Enregistrer";
  saveButton.classList.add("btn-save-mapping");
  saveButton.addEventListener("click", async () => {
  console.log(" Bouton 'Enregistrer le mapping' cliqué");

  const mapping = {};

  // Récupération des champs du formulaire
  document.querySelectorAll(".mapping-row").forEach((row, index) => {
    const formInput = row.querySelector(".input-form");
    const dolibarrSelect = row.querySelector(".select-dolibarr");

    const inputVal = formInput?.value.trim();
    const dolibarrVal = dolibarrSelect?.value.trim();

    console.log(`Ligne ${index + 1} → input: "${inputVal}", dolibarr: "${dolibarrVal}"`);

    if (inputVal && dolibarrVal) {
      mapping[inputVal] = dolibarrVal;
    }
  });

  console.log(" Mapping généré :", mapping);

  // Récupération des profils URL
  const profilsUrl = await browser.storage.local.get("profilsUrl").then(res => res.profilsUrl || {});
  console.log(" Profils URL actuels :", profilsUrl);

  const pageElement = document.getElementById("page");
  const currentUrl = pageElement?.textContent.trim();
  console.log(" URL actuelle :", currentUrl);

  const urlKeyEntry = Object.entries(profilsUrl).find(([_, url]) => url === currentUrl);
  const key = urlKeyEntry ? urlKeyEntry[0] : Date.now().toString();

  console.log(" Clé utilisée pour enregistrer :", key);

  // Enregistrement du mapping
  const store = await browser.storage.local.get("mappings");
  const allMappings = store.mappings || {};
  allMappings[key] = mapping;

  await browser.storage.local.set({ mappings: allMappings });
  console.log("Mapping enregistré :", allMappings);

  // Enregistrement de l’URL si nouvelle
  if (!urlKeyEntry && currentUrl) {
    profilsUrl[key] = currentUrl;
    await browser.storage.local.set({ profilsUrl });
    console.log(" URL ajoutée dans profilsUrl :", profilsUrl);
  }

  alert("Mapping enregistré avec succès !");

  // Ajoute ceci pour mettre à jour l'affichage des boutons :
if (typeof gererAffichageBoutons === "function") {
  gererAffichageBoutons();
  formContainer.remove();
document.body.querySelectorAll("body > *:not(script)").forEach(el => {
  if (el.id !== "add-url-form") el.style.display = "";
});

}
});
  formContainer.appendChild(saveButton);

  // Bouton Retour
  const backButton = document.createElement("button");
  backButton.textContent = "Retour";
  backButton.classList.add("btn-retour-formulaire");
  backButton.addEventListener("click", () => {
    formContainer.remove();
    document.body.querySelectorAll("body > *:not(script)").forEach(el => {
      if (el.id !== "add-url-form") el.style.display = "";
    });
  });
  formContainer.appendChild(backButton);

  // Ajouter au body
  document.body.appendChild(formContainer);
}

//**************************************************************************************************************************

document.getElementById("btn_ajouter_urls").addEventListener("click", async () => {
  try {
    // 1. Récupérer URL proprement
    const pageElement = document.getElementById("page");
    if (!pageElement) {
      alert("Impossible de récupérer la page active");
      return;
    }
    const currentUrl = pageElement.textContent.trim();
    // 2. Appeler ton script PHP distant pour récupérer les champs HTML
    const phpEndpoint = "http://sc4nipi2890.universe.wf/cedy/recupfields/index.php?url=" + encodeURIComponent(currentUrl);
    const response = await fetch(phpEndpoint);
    const data = await response.json();
    if (data.error) {
      alert("Erreur du serveur : " + data.error);
      return;
    }

    // 3. Récupérer les champs Dolibarr (project, tiers, company)
    const dolibarrData = await getAvailableFields();
    const dolibarrFields = getDolibarrFieldsFromData(dolibarrData);
    // 4. Afficher le formulaire de mapping avec tous les champs
    showAddUrlForm(currentUrl, data, dolibarrFields);
  } catch (error) {
    alert("Erreur réseau : " + error.message);
  }
});
//***************************************************************************************************************************************

  async function afficherListeUrls() {
  const containerId = "liste-urls-container";
  const ancienContainer = document.getElementById(containerId);
  if (ancienContainer) ancienContainer.remove(); // Pour éviter doublons

  const { profilsUrl } = await browser.storage.local.get("profilsUrl");
  if (!profilsUrl || Object.keys(profilsUrl).length === 0) {
    alert("Aucune URL enregistrée.");
    return;
  }

  // Masquer tous les autres éléments sauf cette section
  document.body.querySelectorAll("body > *:not(script)").forEach(el => el.style.display = "none");

  const wrapper = document.createElement("div");
  wrapper.id = containerId;
  wrapper.style.padding = "20px";
  wrapper.style.textAlign = "center";

  const titre = document.createElement("h2");
  titre.textContent = "Liste des URLs enregistrées";
  wrapper.appendChild(titre);

  Object.entries(profilsUrl).forEach(([key, url]) => {
    const ligne = document.createElement("div");
    ligne.style.display = "flex";
    ligne.style.alignItems = "center";
    ligne.style.justifyContent = "space-between";
    ligne.style.maxWidth = "600px";
    ligne.style.margin = "10px auto";
    ligne.style.border = "1px solid #ccc";
    ligne.style.padding = "10px";
    ligne.style.borderRadius = "6px";

    const urlText = document.createElement("span");
    urlText.textContent = url;
    urlText.style.flex = "1";
    urlText.style.marginRight = "10px";
    urlText.style.whiteSpace = "nowrap";
    urlText.style.overflow = "hidden";
    urlText.style.textOverflow = "ellipsis";
    urlText.style.maxWidth = "70%"; 
    urlText.setAttribute("title", url);
    ligne.appendChild(urlText);

    // Bouton modifier
    const btnModif = document.createElement("button");
    btnModif.textContent = "Modifier";
    btnModif.style.marginRight = "5px";
    btnModif.onclick = async () => {

      const mappings = await browser.storage.local.get("mappings").then(res => res.mappings || {});
      const mapping = mappings[key];
      if (!mapping) return alert("Aucun mapping existant pour cette URL");

      const dolibarrData = await getAvailableFields();
      const dolibarrFields = getDolibarrFieldsFromData(dolibarrData);

      showEditMappingForm(url, mapping, dolibarrFields, key);
      wrapper.remove();
    };
    ligne.appendChild(btnModif);

    // Bouton supprimer
    const btnDelete = document.createElement("button");
    btnDelete.textContent = "Supprimer";
    btnDelete.onclick = async () => {
      const confirmDelete = confirm("Supprimer cette URL ?");
      if (!confirmDelete) return;

      const mappings = await browser.storage.local.get("mappings").then(res => res.mappings || {});
      delete profilsUrl[key];
      if (mappings[key]) delete mappings[key];

      await browser.storage.local.set({ profilsUrl, mappings });
      alert("Supprimé !");
      afficherListeUrls(); // Recharger
    };
    ligne.appendChild(btnDelete);

    wrapper.appendChild(ligne);
  });

  // Bouton retour
  const retour = document.createElement("button");
  retour.textContent = "Retour";
  retour.style.marginTop = "20px";
  retour.onclick = () => {
    wrapper.remove();
    document.body.querySelectorAll("body > *:not(script)").forEach(el => el.style.display = "");
  };
  wrapper.appendChild(retour);

  document.body.appendChild(wrapper);
}

document.getElementById("voirUrlBtn").addEventListener("click", () => {
  afficherListeUrls();
});


//***************************************************************************************************************************************
  //--- STATUT PERSO ---
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
  statusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('status-key').value;
    const value = document.getElementById('status-value').value;
    let statusMapping = await browser.storage.local.get("statusMapping").then(res => res.statusMapping || {});    
    if (statusMapping.hasOwnProperty(key)) {
      alert("Cette clé existe déjà !");
      return;
    }
    statusMapping[key] = value;
      browser.storage.local.set({ statusMapping }).then(() => {
        console.log("statusMapping sauvegardé !");
      });    statusForm.reset();
    formContainer.style.display = 'none';
    alert("Statut ajouté !");
  });
  //Bouton "Retour au projet"
  document.getElementById("backToProjectBtn").addEventListener("click", () => {
    const lastState = history.state;
    if (lastState && lastState.project) {
      displayProjectDetails(lastState.project);
      document.getElementById("backToProjectBtn").style.display = "none";
    }
  });
  //--- FETCH DES PROJETS ---
async function fetchProjectsIfEntityValid() {
  const entity = await browser.storage.local.get("ENTITY").then(res => res.ENTITY || "");
  const isEnabled = await isMultiCompanyModuleEnabledWith(BASE_URL, API_KEY);
  if (isEnabled) {
    const isValidEntity = await testEntityIsValid(BASE_URL, API_KEY, entity);
    if (!isValidEntity) {
      showErrorMessage("Cette entité n'existe pas ou vous n'avez pas les droits !");
      return; // Ne pas fetch les projets si entité invalide
    }
  }
  //fetch des projets avec DOLAPIENTITY
  const headers = await getHeaders();
  fetch(`${BASE_URL}/projects?DOLAPIENTITY=${entity}`, {
    method: "GET",
    headers
  })
  .then(response => {
    if (response.status === 401) {
      showErrorMessage("Vous n'avez pas les droits sur cette entité !");
      throw new Error(`Erreur HTTP 401`);
    }
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    return response.json();
  })
  .then(async data => {

    const list = document.getElementById("project-list");
list.innerHTML = "";
for (const project of data) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  title.textContent = project.title || "Projet sans nom";
  title.style.cursor = "pointer";
  title.addEventListener("click", async () => {
  const projectDetails = await fetchProjectDetails(project.id);
  if (!projectDetails) {
    console.warn("Aucun détail trouvé pour le projet", project.id);
    return;
  }
  displayProjectDetails(projectDetails);
});
  const ref = document.createElement("div");
  ref.textContent = "Réf : " + (project.ref || "Aucune");
  ref.style.fontSize = "0.9em";
  ref.style.color = "#555";
  item.appendChild(title);
  item.appendChild(ref);
  //Afficher le nom du tiers et l’adresse extra field dès le début
    const tiersName = await await fetchThirdpartyName(project.socid);
    const tierName = document.createElement("div");
    tierName.textContent = "Client : " + tiersName;
    tierName.style.fontSize = "0.9em";
    tierName.style.color = "#444";
    item.appendChild(tierName);
  list.appendChild(item);
}
  })
  .catch(error => {
    const list = document.getElementById("project-list");
    list.innerHTML = `<li style="color:red;">Erreur : ${error.message}</li>`;
    console.error("Erreur dans fetch projects :", error);
  });
}
await fetchProjectsIfEntityValid();
  async function fetchProjectDetails(projectId) {
  const headers = await getHeaders();
  try {
    const response = await fetch(`${BASE_URL}/projects/${projectId}`, {
      method: "GET",
      headers
    });
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    const project = await response.json();
    return project; //  on retourne les données
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    return null; // erreur, on retourne null
  }
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
//Wrapper sans paramètre 
async function isMultiCompanyModuleEnabled() {
  const { BASE_URL: baseUrl = "", API_KEY: apiKey = "" } = await browser.storage.local.get(["BASE_URL", "API_KEY"]);
  if (!baseUrl || !apiKey) {
    console.warn("BASE_URL ou API_KEY non défini dans localStorage");
    return false;
  }
  return await isMultiCompanyModuleEnabledWith(baseUrl, apiKey);
}
async function testMultiCompanyModule() {
  const isEnabled = await isMultiCompanyModuleEnabledWith(BASE_URL, API_KEY);

  const entityLabel = document.getElementById("entityInput")?.closest("label");
  
  if (isEnabled && entityLabel) {
    entityLabel.style.display = "block"; // Affiche le champ
  } else {
  }
}
//fonction pour voir si l'entité existe ou pas 
async function testEntityIsValid(baseUrl, apiKey, entity) {
  const headers = {
    "DOLAPIKEY": apiKey,
    "Content-Type": "application/json"
  };
  try {
    const url = `${baseUrl}/projects?limit=1&DOLAPIENTITY=${entity}`;
    const response = await fetch(url, {
      method: "GET",
      headers
    });
    if (response.status === 404) {
      console.warn("Entity non valide (404)");
      return false; // entité non valide
    }
    if (!response.ok) {
      console.error("Réponse non OK dans testEntityIsValid:", response.status);
      return false;
    }
    return true; // entité valide
  } catch (error) {
    console.error("Erreur réseau dans testEntityIsValid:", error);
    return false; // en cas d'erreur réseau, on considère que l'entité n'est pas valide
  }
}
//Fonction utilitaire pour centraliser les headers (incluant éventuellement l'entité)
async function getHeaders() {
  const { API_KEY, ENTITY } = await browser.storage.local.get(["API_KEY", "ENTITY"]);

  const headers = {
    "DOLAPIKEY": API_KEY || "",
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  if (ENTITY) {
    headers["DOLAPIENTITY"] = ENTITY;
  }

  return headers;
}
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
   if (!projectDetails) {
    console.warn("displayProjectDetails: projectDetails est undefined.");
    return;
  }
  console.log("projectDetails =", projectDetails);
  const startDate = projectDetails.date_c
    ? new Date(projectDetails.date_c * 1000).toLocaleDateString()
    : "Inconnue";

  const defaultMapping = {
    0: "Brouillon",
    1: "Validé",
    2: "Terminé"
  };
  const customMapping = await browser.storage.local.get("statusMapping").then(res => res.statusMapping || {});
  const statusMapping = { ...defaultMapping, ...customMapping };
  const projectStatus = parseInt(projectDetails.status, 10);
  const statusText = statusMapping[projectStatus] || "Inconnu";
  const detailsContainer = document.getElementById("project-details");
  // Récupération des noms via API
  const tiers = await fetchThirdpartyDetails(projectDetails.socid);
  const tiersName = tiers?.name || "Non défini";
  const compagnie = await fetchCompanyDetails();
  // Extra fields
  let extrafieldsHtml = "";
  const extrafields = projectDetails.array_options || {};
  for (const [key, value] of Object.entries(extrafields)) {
    const fieldName = key.replace("options_", "");
    extrafieldsHtml += `<p><strong>${fieldName} :</strong> ${value || "Non défini"}</p>`;
  }
  // Affichage des détails du projet
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
  //Mise à jour de l'état global pour le bouton
  fillFormButton.state = {
    project: { ...projectDetails, statusText },
    company: compagnie,
    tiers: tiers,
    source: "project"
  };
  //Affiche le bouton
  fillFormButton.style.display = "inline-block";
  //Clic sur le lien du tiers
  document.getElementById("tier-link").addEventListener("click", async (e) => {
    e.preventDefault();
    const thirdparty = await fetchThirdpartyDetails(projectDetails.socid);
    if (thirdparty) {
      history.pushState({ project: projectDetails }, "", "tiers");
      displayThirdpartyDetails(thirdparty);
      document.getElementById("backToProjectBtn").style.display = "inline-block";
      fillFormButton.state.tiers = thirdparty;
      fillFormButton.state.source = "tiers";
    }
  });
  // Clic sur le lien de la compagnie
  document.getElementById("company-link").addEventListener("click", async (e) => {
    e.preventDefault();
    history.pushState({ project: projectDetails }, "", "company");
    displayCompanyDetails(compagnie);
    document.getElementById("backToProjectBtn").style.display = "inline-block";
    fillFormButton.state.source = "company";
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
async function fetchCompanyExtraFieldsFromMulticompany(entityId) {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${BASE_URL}/multicompany/${entityId}`, {
      method: "GET",
      headers
    });
    if (!response.ok) {
      console.error("Erreur HTTP récupération extra fields via multicompany :", response.status);
      return {};
    }
    const data = await response.json();
    return data.array_options || {};
  } catch (error) {
    console.error("Erreur lors de la récupération des extra fields (multicompany) :", error);
    return {};
  }
}
//afficher les details de la compagnie
async function displayCompanyDetails(company) {
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
  const isMulticompanyEnabled = await isMultiCompanyModuleEnabled();
  const entity = await browser.storage.local.get("ENTITY").then(res => res.ENTITY || "1");
  if (isMulticompanyEnabled) {
    const extraFields = await fetchCompanyExtraFieldsFromMulticompany(entity);

    for (const [key, value] of Object.entries(extraFields)) {
      const label = key.replace("options_", "").replace(/_/g, " ");
      container.innerHTML += `<p><strong>${label} :</strong> ${value || "Non défini"}</p>`;
    }
  }
}
  //écouteur pour le bouton remplir un formulaire
function resolvePath(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
  fillFormButton.addEventListener("click", async () => {
  const state = fillFormButton.state || {};
  const { source, project, tiers, company } = state;

  if (!source || !project) {
    console.error("Données manquantes ou source non définie.");
    return;
  }
  const pageElement = document.getElementById("page");
  if (!pageElement) {
    console.error("L'élément #page est introuvable");
    return;
  }
  const currentUrl = pageElement.textContent.trim();
  const profilsUrl = await browser.storage.local.get("profilsUrl").then(res => {
  return res.profilsUrl || {
    
  };
});
  const entry = Object.entries(profilsUrl).find(([_, url]) => url === currentUrl);
  if (!entry) {
    console.error("Cette extension ne prend pas encore en charge ce site :", currentUrl);
    showErrorMessage("cette url n'est pas prise en charge ! veuillez l'AJOUTER ");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const [currentKey] = entry;
 const mappings = await browser.storage.local.get("mappings").then(res => {
  return res.mappings || {
   
  };
});
  const map = mappings[currentKey];
  console.log(map);
  if (!map) {
    console.error("Aucun mapping défini pour cette page.");
    return;
  }
  const nosdata = {};
  for (const champFormulaire in map) {
    const fullPath = map[champFormulaire]; 
    nosdata[champFormulaire] = resolvePath({ project, company, tiers }, fullPath) || "";
  }
  browser.tabs.query({ url:`*://${new URL(currentUrl).hostname}/*` }).then(tabs => {
    if (tabs.length === 0) {
      console.error("Aucun onglet ne correspond à cette URL :", currentUrl);
      return;
    }
    const tabActif = tabs[0];
    browser.tabs.sendMessage(tabActif.id, {
      action: "remplirFormulaire",
      data: nosdata,
      project
    });
  });
});
}); 