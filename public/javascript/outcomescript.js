// Load google charts
google.charts.load('current', {
  'packages': ['corechart']
});

const questiondivs = document.querySelectorAll(".questiondiv");
let isBar = [];
questiondivs.forEach(val => {
  isBar.push(false);
});

google.charts.setOnLoadCallback(drawChart);


// Draw the chart and set the chart values
function drawChart() {

  questiondivs.forEach((questiondiv, index) => {
    const type = document.getElementById('type' + index);

    if (type.value === "radiobutton") {

      const radBtnAns = document.querySelectorAll('.radBtnAns' + index);
      const radBtnQtn = document.querySelectorAll('.radBtnQtn' + index);
      const numberCollection = [];
      const qtnOptions = [];

      radBtnQtn.forEach((qtn) => {
        let j = 0;
        radBtnAns.forEach((ans) => {
          if (ans.value === qtn.value) {
            j++;
          }
        });
        qtnOptions.push(qtn.value);
        numberCollection.push(j);

      });

      var data = new google.visualization.DataTable();
      data.addColumn('string', 'Options');
      data.addColumn('number', 'Amount');

      for (i = 0; i < qtnOptions.length; i++) {
        data.addRow([qtnOptions[i], numberCollection[i]]);
      }

      const width = document.getElementById('result').offsetWidth;

      if (isBar[index]) {
        const options = {
          width: 0.7 * width,
          legend: {position: 'none'},
          bar: {groupWidth: "30%"},
          colors: ['#555cff'],
          backgroundColor: {stroke: '#b224ef', strokeWidth: 1},
          vAxis: {minValue: 0},
          hAxis: {slantedText: true, maxAlternation: 5, maxTextLines: 1}
        };

        var chart = new google.visualization.ColumnChart(document.getElementById('question' + index));
        chart.draw(data, options);
      } else {
        // Optional; add a title and set the width and height of the chart
        var options = {
          'width': 0.4 * width,
          'height': 0.4 * width,
          chartArea: {left:20,top:20,width:'100%',height:'100%'},
          is3D: true,
          legend: {
            position: 'right',
            textStyle: {
              fontSize: 16
            }
          }
        };

        var chart = new google.visualization.PieChart(document.getElementById('question' + index));
        chart.draw(data, options);
      }


    } else if (type.value === "checkbox") {
      const checkBoxAns = document.querySelectorAll('.checkBoxAns' + index);
      const checkBoxQtn = document.querySelectorAll('.checkBoxQtn' + index);
      const numberCollection = [];
      const qtnOptions = [];

      checkBoxQtn.forEach((qtn) => {
        let j = 0;
        checkBoxAns.forEach((ans) => {
          if (ans.value === qtn.value) {
            j++;
          }
        });
        qtnOptions.push(qtn.value);
        numberCollection.push(j);

      });


      var data = new google.visualization.DataTable();
      data.addColumn('string', 'Options');
      data.addColumn('number', 'Amount');

      for (i = 0; i < qtnOptions.length; i++) {
        data.addRow([qtnOptions[i], numberCollection[i]]);
      }

      const width = document.getElementById('result').offsetWidth;

      if (isBar[index]) {
        const options = {
          width: 0.7 * width,
          legend: {position: 'none'},
          bar: {groupWidth: "30%"},
          colors: ['#555cff'],
          backgroundColor: {stroke: '#b224ef', strokeWidth: 1},
          vAxis: {minValue: 0},
          hAxis: {slantedText: true, maxAlternation: 5, maxTextLines: 1}
        };

        var chart = new google.visualization.ColumnChart(document.getElementById('question' + index));
        chart.draw(data, options);
      } else {
        // Optional; add a title and set the width and height of the chart
        var options = {
          'width': 0.4 * width,
          'height': 0.4 * width,
          chartArea: {left:20,top:20,width:'100%',height:'100%'},
          is3D: true,
          legend: {
            position: 'right',
            textStyle: {
              fontSize: 16
            }
          }
        };

        var chart = new google.visualization.PieChart(document.getElementById('question' + index));
        chart.draw(data, options);
      }
    }

  });
}

function setChart(index) {
  isBar[index] = !isBar[index];
  drawChart();
  setToggleColor(index)
}

function setToggleColor(index) {
  console.log(index);
  if (isBar) {
    document.getElementById('pieChart' + index).style.backgroundColor = 'white';
    document.getElementById('pieChart' + index).style.color = '#555cff';
    document.getElementById('barChart' + index).style.backgroundColor = '#555cff';
    document.getElementById('barChart' + index).style.color = 'white';
  } else {
    document.getElementById('pieChart' + index).style.backgroundColor = '#555cff';
    document.getElementById('pieChart' + index).style.color = 'white';
    document.getElementById('barChart' + index).style.backgroundColor = 'white';
    document.getElementById('barChart' + index).style.color = '#555cff';
  }
}

window.addEventListener('DOMContentLoaded', (event) => {

  const questiondivs = document.querySelectorAll(".questiondiv");

  questiondivs.forEach((questiondiv, index) => {

    const type = document.getElementById('type' + index);

    if (type.value === "radiobutton") {
      document.getElementById('pieChart' + index).style.backgroundColor = '#555cff';
      document.getElementById('pieChart' + index).style.color = 'white';
      document.getElementById('barChart' + index).style.backgroundColor = 'white';
      document.getElementById('barChart' + index).style.color = '#555cff';

      const radBtnAns = document.querySelectorAll('.radBtnAns' + index);
      const radBtnQtn = document.querySelectorAll('.radBtnQtn' + index);
      const numberCollection = [];
      const qtnOptions = [];

      radBtnQtn.forEach((qtn) => {
        let j = 0;
        radBtnAns.forEach((ans) => {
          if (ans.value === qtn.value) {
            j++;
          }
        });
        qtnOptions.push(qtn.value);
        numberCollection.push(j);

      });

      const total = numberCollection.reduce((accumulator, currentNumber) => {
        return accumulator + currentNumber;
      });

      const table = document.getElementById('table' + index);

      radBtnQtn.forEach((opt, j) => {
        let percent = (numberCollection[j] / total) * 100;
        percent = Math.round((percent + Number.EPSILON) * 100) / 100;
        const newRow = document.createElement('tr');

        for (var i = 0; i < 2; i++) {
          var cell = document.createElement("td");
          let text;
          if (i === 0) {
            text = percent + "%"
          } else {
            text = opt.value
          }
          var cellText = document.createTextNode(text);
          cell.appendChild(cellText);
          newRow.appendChild(cell);
        }
        table.appendChild(newRow);
      });
    } else if (type.value === "checkbox") {
      document.getElementById('pieChart' + index).style.backgroundColor = '#555cff';
      document.getElementById('pieChart' + index).style.color = 'white';
      document.getElementById('barChart' + index).style.backgroundColor = 'white';
      document.getElementById('barChart' + index).style.color = '#555cff';

      const checkBoxAns = document.querySelectorAll('.checkBoxAns' + index);
      const checkBoxQtn = document.querySelectorAll('.checkBoxQtn' + index);
      const numberCollection = [];
      const qtnOptions = [];

      checkBoxQtn.forEach((qtn) => {
        let j = 0;
        checkBoxAns.forEach((ans) => {
          if (ans.value === qtn.value) {
            j++;
          }
        });
        qtnOptions.push(qtn.value);
        numberCollection.push(j);

      });

      const total = numberCollection.reduce((accumulator, currentNumber) => {
        return accumulator + currentNumber;
      });

      const table = document.getElementById('table' + index);

      checkBoxQtn.forEach((opt, j) => {
        let percent = (numberCollection[j] / total) * 100;
        percent = Math.round((percent + Number.EPSILON) * 100) / 100;
        const newRow = document.createElement('tr');

        for (var i = 0; i < 2; i++) {
          var cell = document.createElement("td");
          let text;
          if (i === 0) {
            text = percent + "%"
          } else {
            text = opt.value
          }
          var cellText = document.createTextNode(text);
          cell.appendChild(cellText);
          newRow.appendChild(cell);
        }
        table.appendChild(newRow);
      });
    }
  });
});

function exportPdf() {
  // Choose the element that our invoice is rendered in.
  const element = document.getElementById('result');
  var opt = {
    filename: 'result.pdf',
    image: {
      type: 'jpeg',
      quality: 0.98
    },
    pagebreak: {after: ['.questiondiv']},
    margin: 0.25,
    jsPDF: {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait'
    }
  };
  // Choose the element and save the PDF for our user.
  html2pdf().set(opt).from(element).save();
}

function exportImg() {

  var node = document.getElementById('result');

  domtoimage.toPng(node)
    .then(function(dataUrl) {
      var img = new Image();
      img.src = dataUrl;
      downloadURI(dataUrl, "result.png")
    })
    .catch(function(error) {
      console.error('oops, something went wrong!', error);
    });

}

function downloadURI(uri, name) {
  var link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  delete link;
}
