
function saveSurvey() {
  document.querySelector('.surveyform').submit();
}

function addAnswerButton(number) {
  console.log(number);

  if (document.querySelector('#radiobtn' + number)) {
    document.querySelectorAll('#radiobtn' + number).forEach((radiobtn) => {
      radiobtn.parentNode.remove();
    });
  } else if (document.querySelector('#checkbox' + number)) {
    document.querySelectorAll('#checkbox' + number).forEach((checkbox) => {
      checkbox.parentNode.remove();
    });
  } else if (document.querySelector('#shortanswer' + number)) {
    console.log("shortanswer");
    document.querySelector('#shortanswer' + number).remove();
  }

  const respTypeSelect = document.getElementById('resp-type-select' + number);
  const addAnswerBtn = document.getElementById('add-ans-btn' + number);

  if (respTypeSelect.value === "checkbox" || respTypeSelect.value === "radiobutton") {
    addAnswerBtn.style.visibility = "visible";

  } else if (respTypeSelect.value === "shortanswer"){
    addAnswerBtn.style.visibility = "collapse";

    let newPar = document.createElement('p')
    newPar.id = 'shortanswer' + number;
    newPar.innerHTML = 'Short answer text';

    const question = document.getElementById(number).parentNode;
    const endquestion = document.getElementById('endquestion' + number);

    question.insertBefore(newPar, endquestion);
  } else {
    addAnswerBtn.style.visibility = "collapse";
  }
}

function deleteQuestion(number) {
  console.log(number);
  const question = document.getElementById(number).parentNode;
  console.log(question);
  const uploadBtn = document.querySelector('.uploaddiv' + number);
  uploadBtn && uploadBtn.remove();
  question.remove();
}

function deleteimg(number) {
  console.log(number);
  const img = document.getElementById('img' + number);
  const imgdiv = img.parentNode;
  console.log(img);
  img.remove();
  imgdiv.remove();
}

function deleteAnswer(number, index) {
  console.log(number + "+" +  index);
  const answer = document.getElementById(number + "" + index);
  console.log(answer);
  answer.remove();
}
