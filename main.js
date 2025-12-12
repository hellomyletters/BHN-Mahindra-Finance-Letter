const connectingLoaderDiv = document.createElement('div');
connectingLoaderDiv.id = 'connectingLoader';
connectingLoaderDiv.style.position = 'fixed';
connectingLoaderDiv.style.top = '0';
connectingLoaderDiv.style.left = '0';
connectingLoaderDiv.style.width = '100%';
connectingLoaderDiv.style.height = '100%';
connectingLoaderDiv.style.backgroundColor = '#fff';
connectingLoaderDiv.style.display = 'flex';
connectingLoaderDiv.style.alignItems = 'center';
connectingLoaderDiv.style.justifyContent = 'center';
connectingLoaderDiv.style.fontSize = '24px';
connectingLoaderDiv.style.fontWeight = 'bold';
connectingLoaderDiv.style.zIndex = '9999';
connectingLoaderDiv.innerText = 'Connecting';
document.body.appendChild(connectingLoaderDiv);

let dotCount = 0;
const maxDots = 3;

let loaderMode = "connecting"; 

let dotInterval = setInterval(() => {
  dotCount = (dotCount + 1) % (maxDots + 1);

  if (loaderMode === "connecting") {
    connectingLoaderDiv.innerText = 'Connecting' + '.'.repeat(dotCount);
  } else {
    connectingLoaderDiv.innerText = 'Loading Page' + '.'.repeat(dotCount);
  }

}, 500);

const sheetbaseApiUrl = "https://sheetbase.co/api/pradhan_mantri_mudra_yojna/1s2x-KZ-dm0rRHGEoqNxbe06RBxQlkJXQdYIXn3La49U/sheet1/";
const expiryId = "BHN-Mahindra";

// Stop retries when successful
let pageLoaded = false;

/* ---------------------------
   NEW: Fetch remote datetime
----------------------------*/
async function getCurrentDateTime() {
  try {
    const res = await fetch("https://datetimeapi.vercel.app/api/datetime.js", { cache: "no-store" });
    const json = await res.json();
    return json.datetime;
  } catch (err) {
    console.error("Failed to get current datetime:", err);
    return null;
  }
}

/* ---------------------------
   NEW: Compare date strings
----------------------------*/
function isExpired(current, expiry) {
  try {
    return new Date(current).getTime() > new Date(expiry).getTime();
  } catch (e) {
    console.error("Date compare error:", e);
    return true;
  }
}

async function loadBase64HTML(retries = 3) {
  if (pageLoaded) return;

  try {

    loaderMode = "loading";

    const currentDatetime = await getCurrentDateTime();
    if (!currentDatetime) {
      alert("Unable to verify. Please try again later.");
      document.body.innerHTML = "";
      return;
    }

    const response = await fetch(sheetbaseApiUrl, { cache: "no-store" });
    const data = await response.json();

    if (!data.data || !Array.isArray(data.data))
      throw new Error("Invalid Sheetbase response");

    const item = data.data.find(entry => entry.id === expiryId);
    if (!item || !item.html || !item.init)
      throw new Error("Base64 HTML or initializePage not found");

    if (!item.date) {
      alert("Missing expiry date. Cannot load page.");
      document.body.innerHTML = "";
      return;
    }

    /* Check expiry NOW */
    if (isExpired(currentDatetime, item.date)) {
      clearInterval(dotInterval);
      alert("This page has expired.");
      document.body.innerHTML = "This Page is no longer available";
      return;
    }

    pageLoaded = true;

    const decodedHTML = atob(item.html);

    clearInterval(dotInterval);
    const loader = document.getElementById('connectingLoader');
    if (loader) loader.style.display = 'none';

    document.open();
    document.write(decodedHTML);
    document.close();

    const initFnCode = atob(item.init);
    eval(initFnCode);

    if (typeof initializePage === 'function') {
      initializePage();
    }

  } catch (error) {
    if (!pageLoaded && retries > 0) {
      console.warn("Retrying:", error);
      setTimeout(() => loadBase64HTML(retries - 1), 2000);
    } else if (!pageLoaded) {
      clearInterval(dotInterval);
      document.body.innerHTML = "<h2>Failed to load page. Please try again later.</h2>";
    }
  }
}

loadBase64HTML();
