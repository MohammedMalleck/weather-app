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
