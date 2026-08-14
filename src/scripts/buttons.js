document.addEventListener('DOMContentLoaded', function(){
  const submit = document.getElementById('submitBtn');
  if(submit){
    submit.addEventListener('click', function(){
      this.classList.add('onclic');
      setTimeout(()=>{
        this.classList.remove('onclic');
        this.classList.add('validate');
        setTimeout(()=>{ this.classList.remove('validate'); }, 1200);
      }, 2000);
    });
  }

  document.querySelectorAll('.svg-btn svg rect').forEach(function(rect){
    rect.classList.add('path');
  });
});
