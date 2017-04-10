$("document").ready(function() {

  // Bootstrap Modal
// var painting_one = $("#img1");
// var myModal = $("#myModal");
//
// painting_one.click(function(e){
//   e.preventDefault();
//   showModal();
// })
//
// function showModal() {
//   myModal.modal("show");
//   $("#myModalLabel").text("sjkdnskjadnkasdnla");
// }

$('#myModal').on('show.bs.modal', function (event) {
  var img = $(event.relatedTarget) // Img that triggered the modal
  var paintingName = img.data('pname') // Extract info from data-* attributes
  // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
  var paintingSrc = img.attr('src')
  var modal = $(this)
  modal.find('.modal-title').text(paintingName)
  modal.find('.modal-src').attr('src', paintingSrc);
})


});
