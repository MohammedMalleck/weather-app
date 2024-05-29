import { getWeather } from "./weather.js";
import { getImage } from "./images.js";
import { InputEvent } from "./search.js";


async function loader() {
  const {longitude , latitude} =  await getCurrentLocation();
  document.querySelector("progress").value = 40;
  await getWeather(latitude,longitude);
  document.querySelector("progress").value = 70;
  const bgImage = await getImage(latitude, longitude);
  document.querySelector("progress").value = 100;
  setTimeout(() => {
    document.querySelector("main").style.backgroundImage = `url(${bgImage})`;
    document.querySelector("main").classList.add("loaded");
  }, 500);
}
loader();

document.querySelector("main").addEventListener('animationend',()=>{
  document.querySelector("body").style.backgroundColor = `white`;
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

new InputEvent(document.querySelector('input'));