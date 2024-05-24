import { apiKeys } from "./keys.js";

const {rapidAPIKey} = apiKeys();

async function loader() {
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      document.querySelector("progress").value = 50;
      resolve();
    }, 1000);
  });
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      document.querySelector("progress").value = 100;
      resolve();
    }, 500);
  });
  setTimeout(() => {
    document.querySelector("main").classList.add("loaded");
    document.querySelector("main").style.backgroundImage = `url(images/pexels-photo-259447.jpeg)`;
  }, 500);
}
loader();

document.querySelector("main").addEventListener('animationend',()=>{
  document.querySelector("body").style.backgroundColor = `white`;
});


document.querySelector('input').addEventListener('input',autoSuggestCities);

async function autoSuggestCities(){
  const searchOptionsContainer = document.querySelector('.search-options-container');
  const headEl = document.querySelector('header');
  const keyword = document.querySelector('input').value;

  if(keyword === ''){
    headEl.classList.remove('typing');
    return;
  };

  const regex = new RegExp(keyword,'gi');
  try{
    const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&offset=0&types=CITY&namePrefix=${keyword}`,{
      headers : {
        'X-RapidAPI-Key' : rapidAPIKey,
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }
    });

    if(!response.ok) throw new Error('Some network issues');
    

    const responseData = await response.json();
    const citiesArrayUnfiltered = responseData.data;


    if(!citiesArrayUnfiltered.length){
      searchOptionsContainer.innerHTML = `<div class="search-option-container"><span>No results found</span></div>`;
      return;
    };
    

    const citiesArray = citiesArrayUnfiltered.map(cityObj => cityObj.name);
    //filter out the cities name that are repeated
    const citiesArrayFiltered = [...new Set(citiesArray)];

    //display search options container
    if(!headEl.classList.contains('typing')){
      headEl.classList.add('typing');
    }

    //add html content to search options container 
    searchOptionsContainer.innerHTML = citiesArrayFiltered.map((cityName)=>{
        return `<div class="search-option-container">
          <i class="fa-solid fa-location-dot"></i>
          <div>${cityName}</div>
        </div>`
    }).join('\n');

    //make matching keyword bold 
    document.querySelectorAll('.search-option-container div').forEach(optionEl =>
    {
      const optionElText =  optionEl.textContent;
      const newText = optionElText.replace(regex,match =>`<span>${match}</span>`);
      optionEl.innerHTML = newText;
    });
  
    

  } catch(error){
    console.log(`Error while fetching cities suggestions : ${error.message}`)
  }

};
