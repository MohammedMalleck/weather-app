import { getWeather } from "./weather.js";
import { InputEvent } from "./search.js";
import { TimerWeather } from "./timer.js";

export const timer = new TimerWeather();

async function loader() {
  const {longitude , latitude} =  await getCurrentLocation();
  document.querySelector("progress").value = 40;
  const {id , cityName} = await getWeather(latitude,longitude);
  document.querySelector("progress").value = 70;
  const imageLink = `images/${id}.jpg`;
  document.querySelector("progress").value = 100;
  //add image first then display weather
  setTimeout(()=>{
    document.querySelector('.loader-container').classList.add('hide');
    document.querySelector("main").classList.add('addMask');
    document.querySelector("main").style.backgroundImage = `url(${imageLink})`;
    //display current city name in search bar
    document.querySelector('input').value = cityName;
  },500)
  setTimeout(() => {
    document.querySelector("main").classList.add("loadAnimation");
  }, 1000);

  //start the timer
  timer.startTimer();
}
loader();

document.body.addEventListener('animationend',()=>{
  document.body.style.backgroundColor = 'white';
});



async function getCurrentLocation(){
  if(navigator.geolocation){
  try{
    return await new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition(position => resolve({longitude : position.coords.longitude , latitude : position.coords.latitude}), error => reject(error));
    });
    
  }catch(error){
   return  {
      longitude : 4.9041,
      latitude : 52.3676
    };
  }    
  }
}

new InputEvent(document.querySelector('input'),document.querySelector('.search-icon-container'));

document.querySelector('.read-more').addEventListener('click',()=>{
  document.querySelector('.error-text-container').classList.add('show');
});