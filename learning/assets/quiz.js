/* 共享测验组件。
   用法：
   <div class="quiz" data-quiz>
     <p class="quiz-prompt">题干</p>
     <div class="quiz-options">
       <button type="button" data-ok="true"  data-why="为何正确">选项</button>
       <button type="button" data-ok="false" data-why="为何错误">选项</button>
     </div>
   </div>
   每题只有一次作答机会，作答后立即给出反馈并锁定选项。 */
document.querySelectorAll("[data-quiz]").forEach(function (quiz) {
  var options = quiz.querySelectorAll(".quiz-options button");
  var answered = false;

  options.forEach(function (button) {
    button.addEventListener("click", function () {
      if (answered) return;
      answered = true;

      var isCorrect = button.dataset.ok === "true";
      button.classList.add(isCorrect ? "correct" : "incorrect");

      if (!isCorrect) {
        var right = quiz.querySelector('.quiz-options button[data-ok="true"]');
        if (right) right.classList.add("correct");
      }

      options.forEach(function (b) {
        b.disabled = true;
      });

      var feedback = document.createElement("p");
      feedback.className = "quiz-feedback";
      feedback.setAttribute("role", "status");

      var verdict = document.createElement("strong");
      verdict.textContent = isCorrect ? "答对了。 " : "再看一眼。 ";
      feedback.appendChild(verdict);
      feedback.appendChild(
        document.createTextNode(button.dataset.why || "")
      );
      quiz.appendChild(feedback);
    });
  });
});