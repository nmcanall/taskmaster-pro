var tasks = {};



// Build a new task
var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // Audit tasks to see if past due or two days out
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};



// Load tasks when page initiates
var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};



// Helper method to save tasks to local storage
var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};



// Edit element title by clicking on it
$(".list-group").on("click", "p", function() {
  var text = $(this).text().trim();
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// Save editted element when clicking away ("blur")
$(".list-group").on("blur", "textarea", function() {
  var text = $(this).val().trim();
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  var index = $(this).closest(".list-group-item").index();

  // Update the tasts array
  tasks[status][index].text = text;
  saveTasks();

  // Recreate p element back from the text area
  var taskP = $("<p>").addClass("m-1").text(text);
  $(this).replaceWith(taskP);
});



// Edit date by clicking on it
$(".list-group").on("click", "span", function() {
  // Get current text
  var date = $(this).text().trim();
  var dateInput = $("<input>").attr("type", "text").addClass("form-control").val(date);
  $(this).replaceWith(dateInput);
  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      $(this).trigger("change")
    }
  });
  dateInput.trigger("focus");
});

// Save new date when a date is selected ("change")
$(".list-group").on("change", "input", function() {
  var date = $(this).val().trim();
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  var index = $(this).closest(".list-group-item").index();

  // Update the tasts array
  tasks[status][index].date = date;
  saveTasks();

  // Recreate p element back from the text area
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);
  $(this).replaceWith(taskSpan);

  // Audit tasks for overdue or upcoming dates
  auditTask($(taskSpan).closest(".list-group-item"));
});



// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});



// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});



// Draggable functionality
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function(event) {
    var tempArr = [];
    $(this).children().each(function() {
      var text = $(this).find("p").text().trim();
      var date = $(this).find("span").text().trim();
      tempArr.push({
        text: text,
        date: date
      });
    });
    var arrName = $(this).attr("id").replace("list-", "");
    tasks[arrName] = tempArr;
    saveTasks();
  }
});



// Drop into trash functionality
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
    // saveTasks() called because drop automatically calls sortable
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});



// Datepicker functionality
$("#modalDueDate").datepicker( {
  minDate: 1
});



// Audit upcoming tasks
var auditTask = function(taskEl) {
  var date = $(taskEl).find("span").text().trim();
  var time = moment(date, "L").set("hour", 17);
  
  // Remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // Apply danger class if overdue
  if(moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }

  // Apply warning class if it is 2 days out
  else if(Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};



// Reload the audit task every 5 seconds
setInterval(function() {
  $(".card .list-group-item").each(function(el) {
    auditTask(el);
  });
}, 1800000);



// load tasks for the first time
loadTasks();


