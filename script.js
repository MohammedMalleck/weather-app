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


class InputEvent{

  #timeoutId;
  #searchedArray = JSON.parse(localStorage.getItem('searchedArray')) || [];

  constructor(element){
    element.addEventListener('input',()=>{
      clearTimeout(this.#timeoutId);
      this.#timeoutId =  setTimeout(()=>{
        this.autoSuggestCities();
      },1000);
    });
  }
  
  async autoSuggestCities(){
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
        //convert the cities names array into an array of objects
        const citiesObjects = citiesArrayFiltered.map((name)=>{
        return {cityName : name , hasBeenSearched :false};
        });
        //replace the value of "hasBeenSearched" for those  keywords
        //who have been searched before
        const citiesObjectsModified = citiesObjects.map((cityObj)=>{
          const name = cityObj.cityName;
          for (const cityObj of  this.#searchedArray){
            const nameSearched = cityObj.cityName;
            if(nameSearched === name) {
              return {
                cityName : name,
                hasBeenSearched : true
              }
            };
          }
          return cityObj;
        });
        //get the matching searched keywords
        const getMatchingRecentKeywords = citiesObjectsModified.filter((cityObj) => cityObj.hasBeenSearched);
        //get the other  keywords
        const getOtherKeywords = citiesObjectsModified.filter((cityObj) => !cityObj.hasBeenSearched);
        //join them together such that the recent searches appear first in the array
        const cities = [...getMatchingRecentKeywords,...getOtherKeywords];

        //display search options container
        if(!headEl.classList.contains('typing')){
          headEl.classList.add('typing');
        }
    
        //add html content to search options container 
        searchOptionsContainer.innerHTML = cities.map((cityObject)=>{
            return `<div class="search-option-container ${cityObject.hasBeenSearched ? 'recent-searched' : ''}">
            <i id="history" class="fa-solid fa-clock-rotate-left"></i>
            <i id="location" class="fa-solid fa-location-dot"></i>
            <div class="city-name">${cityObject.cityName}</div>
            <div class="recent-container">
              <div class="remove-text">remove</div>
            </div>
          </div>`
        }).join('\n');
    
        //make matching keyword bold 
        document.querySelectorAll('.city-name').forEach(cityNameEl =>
        {
          const cityName =  cityNameEl.textContent;
          const newText = cityName.replace(regex,match =>`<span>${match}</span>`);
          cityNameEl.innerHTML = newText;
        });

        //make search option el's interactive
        document.querySelectorAll('.search-option-container').forEach((optionEl)=>{
          optionEl.addEventListener('click',(e)=>{
            const cityName = optionEl.querySelector('.city-name').textContent;
            const removeEl = optionEl.querySelector('.remove-text');

            //if the searchedArray is empty then add 
            //the clicked keyword to the array
            if(!this.#searchedArray.length){
              this.addKeywordToSearchedArray(cityName);
            }else{
              //if it isnt empty then iterate through the array
              //and see if this keyword is already present or not
              for (const cityObj of this.#searchedArray){
                //if it is present and  removed el
                //was clicked then remove the keyword from the array
                if(cityObj.cityName === cityName && e.target === removeEl){
                  const matchedCityIndex = this.#searchedArray.findIndex(cityObj => cityObj.cityName === cityName);
                  this.#searchedArray.splice(matchedCityIndex,1);
                  localStorage.setItem('searchedArray',JSON.stringify(this.#searchedArray));
                }else if(cityObj.cityName === cityName){
                  //if it is present but the removed el was not clicked
                  //then render the weather for this city
                  console.log('render weather');
                }else{
                  //if its not present then add the keyword
                  //to the array 
                  this.addKeywordToSearchedArray(cityName);
                }
              }
            }
              
            headEl.classList.remove('typing');
          });
        });
      } catch(error){
        console.log(`Error while fetching cities suggestions : ${error.message}`)
      }
    
  
  };

  addKeywordToSearchedArray(cityName){
    this.#searchedArray.unshift({cityName : cityName , hasBeenSearched : true});
    localStorage.setItem('searchedArray',JSON.stringify(this.#searchedArray));
    document.querySelector('input').value = cityName;
    console.log('after adding keyword  render weather');
  }

};

new InputEvent(document.querySelector('input'));


