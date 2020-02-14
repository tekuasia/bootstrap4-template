// import 'bootstrap'
import '../styles/index.scss'

function docReady ($) {
  $(function () {
    // document ready
    $('body').prepend('HELLO WORLD')
  })
}

docReady(jQuery)
