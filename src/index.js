/* eslint-disable */
//  import core files
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap';
import './styles.scss';
import navbarTemplate from './templates/navbar.html';
import modalTemplate from './templates/modal.html';
import checkoutTemplate from './templates/checkout-template.html';
import paymentMethodRadioTemplate from './templates/payment-method-radio.html';
import mkCarousel from './carousel';
import refreshProducts from './products';
// Password encryption with Bcrypt
const bcrypt = require('bcryptjs');

//  this is the function which is used when the page loads
$(() => {
  // for convenience we create a jQuery object in which
  //  we will be able to put the content of our pages
  const $pageContent = $('<div class="page-content"></div>');

  let categories = [];
  let products = [];

  function loggedUserNav() {
    $('#nav-login').hide();
    $('#nav-register').hide();
    $('#nav-username').show();
    $('#nav-logout').show();
    $('#registration-submit').attr('data-id', 'update-submit');
    // $('button').attr('form', 'update-submit');
  }

  function guestUserNav() {
    $('#nav-username').hide();
    $('#nav-logout').hide();
    $('#nav-login').show();
    $('#nav-register').show();
    // $('button').attr('form', 'registration-submit');
  }

  function fillPageContent(wantedCategory = -1) {
    $('.shopping-cart').hide();
    $('.login-container').hide();
    $('.register-container').hide();
    $('.alert-danger').hide();

    $pageContent.empty();

    // When User Item in Local Storage is set
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    console.log(loggedInUser);
    // Make Navigation Elements when User LogsIn
    if (loggedInUser === null) {
      guestUserNav();
    } else {
      loggedUserNav();
      $('#sp-username').text(loggedInUser.firstname);
    } 

    // Make Navigation Elements when User LogsOut
    $('#nav-logout').click((e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      guestUserNav();
    });

    // ------------------------------------------------------------
    //  populate carousel with categories
    const $carousel = mkCarousel(categories);
    // we put the page element (carousel inside the $pageContent)
    $pageContent.append($carousel);
    $carousel.carousel();

    //  Iterate over the categories and append to navbar
    const $navbarNav = $('.navbar-nav')
      .empty()
      .append(`
        <li class="nav-item">
          <a class="nav-link" data-id="-1" data-name="All products" href="#">
            All Products
          </a>
        </li>`);
    categories.forEach((category, number) => {
      $navbarNav
        .append(`
          <li class="nav-item">
            <a class="nav-link" data-id="${number}" data-name="${category.name}" href="#">${category.name}</a>
          </li>`);
    });
    // ------------------------------------------------------------
    // append products-grid inside the $pageContent
    $pageContent
      .append('<div class="shop-description">This is a Prototype Shop built during my training at Devugees with jQuery, NodeJS, MySQL and Neutrino. Please try it out or check the codebase on <a href="https://github.com/Versioncrowd/onlineshop-react-mongo-node">Github</a>. It has integrated: Registration with Mailnotifier, Login using JWT-Token, Checkout and Order Functionality.</div>')
      .append(`<div class="infobox"><h3 id="infos">All products (${Object.keys(products).length})</h3></div>`)
      .append('<div id="products-grid" class="container-fluid"></div>');

    //  populate products-grid with products
    $('#products-grid').append('<div class="row"></div>');
    refreshProducts(products, wantedCategory);

    // click event handler on nav-links
    $('.nav-link').click((eventObj) => {
      eventObj.preventDefault();
      const { target } = eventObj;
      const categoryId = target.getAttribute('data-id');
      $('.navbar-nav .active').removeClass('active');
      $(target).closest('li').addClass('active');

      fillPageContent(categoryId);
    });
  }

  $('#root')
    // we keep that outside of the page content
    // because when we click on product details
    // we replace its content
    // (rather than creating the whole modal again)
    .append(modalTemplate)
    // the navbar stays accross the pages so
    // we keep it outside of the page content too
    .append(navbarTemplate)
    // we add the $pageContent here and
    // we will modify its own content later
    .append($pageContent);

  // in order to handle errors in consistent manner
  function handleAJAXError(xhr, status, error) {
    $pageContent
      .empty()
      .append(`<div>Ajax Error categories: ${error}</div>`);
  }

  // NAVBAR BUTTONS FUNCTIONALITY
  // Triggers Cart Modal
  // hide the other Modals if open
  // the #cart element is located in the navbar
  // (which has been add above)

  $('#cart').click(((e) => {
    e.preventDefault();
    $('.shopping-cart').toggle('slow');
    if ($('.login-container').is(':visible')) {
      $('.login-container').hide();
    }
    if ($('.register-container').is(':visible')) {
      $('.register-container').hide();
    }
  }));

  // Triggers the Login Modal and hide the other Modals if open
  $('#login').click(((e) => {
    e.preventDefault();
    console.log($('.register-container form').attr('id'));
    $('#login-submit input').val(''); // empty all prev val first
    $('.alert-danger').remove(); // remove any prev errors
    $('.login-container').toggle('slow');
    if ($('.shopping-cart').is(':visible')) {
      $('.shopping-cart').hide();
    }
    if ($('.register-container').is(':visible')) {
      $('.register-container').hide();
    }
    $('#inputEmail').focus();
  }));

  // Switch to login when user already has an account
  $('#login-link').click(((e) => {
    e.preventDefault();
    $('#login-submit input').val(''); // empty all prev val first
    $('.alert-danger').remove(); // remove any prev errors
    $('.login-container').toggle('slow');
    if ($('.shopping-cart').is(':visible')) {
      $('.shopping-cart').hide();
    }
    if ($('.register-container').is(':visible')) {
      $('.register-container').hide();
    }
    $('#inputEmail').focus();
  }));

  // Trigger the Register Modal and hide the other Modals if open
  $('#register').click(((e) => {
    e.preventDefault();
    $('#registration-submit input').val(''); // empty all prev val first
    $('.alert-danger').remove(); // remove any prev errors
    $('.register-container').toggle('slow');
    if ($('.shopping-cart').is(':visible')) {
      $('.shopping-cart').hide();
    }
    if ($('.login-container').is(':visible')) {
      $('.login-container').hide();
    }
    $('#inputFirstname').focus();
  }));

  // Switch to register when "Dont have and account" in Signin Modal
  $('#register-link').click(((e) => {
    e.preventDefault();
    console.log($('.register-container form').attr('id'));
    $('#register-submit input').val(''); // empty all prev val first
    $('.register-container').toggle('slow');
    if ($('.shopping-cart').is(':visible')) {
      $('.shopping-cart').hide();
    }
    if ($('.login-container').is(':visible')) {
      $('.login-container').hide();
    }
    $('#inputFirstname').focus();
  }));

  // UPDATE USER INFO Container
  $('#username').click((e) => {
    e.preventDefault();
    console.log($('.register-container form').attr('id'));
    $('.register-container').toggle('slow');
    $('form').attr('data-id', 'update-submit');
    if ($('.shopping-cart').is(':visible')) {
      $('.shopping-cart').hide();
    };

    // get the user information from the local storage and prefill form
    const user = JSON.parse(localStorage.getItem('user'));
    $('.form-register-heading').text('Update User Info');
    $('#btnSubmit').text('Update');
    $('#login-link').hide();
    $('#inputFirstname').val(user.firstname);
    $('#inputLastname').val(user.lastname);
    $('#inputBirthdate').val(user.birthdate);
    $('#inputStreet').val(user.street);
    $('#inputCity').val(user.city);
    $('#inputPostal').val(user.postal);    
    $('#inputTel').val(user.tel);
    $('#inputRegEmail').val(user.email);
    $('#inputPasswordReg').hide();
    $('#inputPasswordConfirmReg').hide();

    $('#registration-submit').prop('id', 'update-submit');
    // $('button').prop('form', 'update-submit');
    // $('#update-submit').attr('data-id', user.id);

  });

  // Checkout button in Cart Modal
  $('.checkout-proceed').click(() => {
    // create a jQuery object filled with the checkoutTemplate
    const $checkout = $(checkoutTemplate);
    // get the user information from the local storage
    const user = JSON.parse(localStorage.getItem('user'));
    if(!localStorage.getItem('user')) {
      $('.shopping-cart-items').after(`<div class="alert alert-danger" role="alert">
      Please Register or Login to continue.
    </div>`)
    }
    
    // change the field values accordingly
    $checkout.find('[name="user-name"]').val(`${user.firstname} ${user.lastname}`);
    $checkout.find('[name="user-street"]').val(user.street);
    $checkout.find('[name="user-postal"]').val(`${user.postal}`);
    $checkout.find('[name="user-city"]').val(`${user.city}`);

    const storedProducts = JSON.parse(localStorage.getItem('cart'));
    let total = 0;
    const $productsList = $checkout.find('.product-list');
    storedProducts.forEach((product) => {
      $productsList.append(`<li>
      <img class="cart-img" src="/static/assets/images/0${product.catid}.jpg" alt="${product.name}" />
        <span class="item-name">${product.name}</span>
        <span class="item-price">Price: ${product.price}€</span>
        <span class="item-quantity">Quanity: ${product.quantity}</span>
      </li>`);

      total += parseInt(product.price, 10) * product.quantity;
    });
    $checkout.find('.cart-total').text(`Total: € ${total}`);
    $checkout.find('.ded-total').text(`Deduction: € ${total}`);

    // we attach a click listener on the "buy" button
    $checkout.find('.checkout-buy').click((evt) => {
      // prevent the default behavior (wich would submit the form)
      evt.preventDefault();
      // we need a JSON string of the data to be sent
      const data = JSON.stringify({
        products: storedProducts,
        user: {
          id: user.id,
          email: user.email,
          name: $checkout.find('[name="user-name"]').val(),
          street: $checkout.find('[name="user-street"]').val(),
          city: $checkout.find('[name="user-city"]').val(),
        },
        /* payment_method: $checkout.find('[name="payment"]:checked').val(), */
      });

      console.log(user.token);
     
      // to send a POST request to the server
      $.ajax('http://localhost:9090/api/order', {
        method: 'POST',
        headers: {
          "Authorization": "Bearer " + user.token
        },
        // the content-type of the request has to be application/json
        // in order for the server to be able to read the body (of the request)
        contentType: 'application/json',
        data,
      })
        .done(() => {
          $checkout
            .empty()
            .append(`<div class="alert alert-success">
              The order has been placed!
            </div>`);
        })
        .fail(() => {
          $checkout
            .empty()
            .append(`<div class="alert alert-danger">
              An error occured, sorry.
            </div>`);
        });
    });


    $checkout.find('.checkout-cancel').click(() => {
      fillPageContent();
    });


    // we put the $checkout in the page
    // (a text "Payment methods are loading" is visible)
    $pageContent
      .empty()
      .append($checkout);

    // we clear the .payment-methods (in which the loading text is)
    // and keep a reference ($paymentMethods) for later access
    /* const $paymentMethods = $checkout
      .find('.payment-methods')
      .empty();

    $.ajax('//localhost:9090/api/payment_methods')
      .done((data) => {
        // for each payment methods returned by the API
        data.forEach((paymentMethod) => {
          // we create a jQuery object
          const $paymentMethod = $(paymentMethodRadioTemplate);
          // in which we alterate the wanted attributes...
          $paymentMethod.find('input').attr('value', paymentMethod.id);
          // ...and texts
          // It's important to do the ".find()" on the smallest set possible
          // if we have used .find() on $checkout,
          // it would have unwanted side effects (because the $checkout has several 'span's)
          $paymentMethod.find('span').text(paymentMethod.name);
          // finally we append the payment method to its container
          $paymentMethods.append($paymentMethod);
        });
      })
      // we could also use the handleAJAXError here
      .fail((xhr, status, error) => {
        $paymentMethods.text(error.message);
      }); */

    // close the cart widget
    $('.shopping-cart').hide('slow');
  });

  // we will trick the $pageContent to add a padding top
  // equivalent to the navbar outer height
  // (don't forget to remove styles which were supposed to do that in your SCSS)
  $pageContent.css('padding-top', $('.navbar').outerHeight());

  // read categories
  $.ajax('http://sabinegottfried.tk:9090/api/categories')
    .done((data) => {
      // store the data in the variable declared above
      categories = data;
      fillPageContent();
    })
    //  or fail trying
    .fail(handleAJAXError);

  // ajax req and append products grid
  $.ajax('http://sabinegottfried.tk:9090/api/products')
    .done((data) => {
      // store the data in the variable declared above
      products = data;
      fillPageContent();
    })
    //  or fail trying
    .fail(handleAJAXError);

  // Handle Error Messages with error and the corresponding form element
  function handleErrors(error, form) {
    const errorbox = `<div class="alert alert-danger" role="alert"><b>Error</b> ${error}</div>`;
    $('.alert-danger').remove();
    $(`${form}`).append(errorbox);
  }

  $('#login-submit').on('submit', ((e) => {
    e.preventDefault();
      const userlogindata = {};
      userlogindata.email = $('#inputEmail').val();
      userlogindata.pwd = $('#inputPassword').val();
      const json = JSON.stringify(userlogindata);
      // console.log(userlogindata);
      $.ajax({
        type: 'POST',
        url: 'http://sabinegottfried.tk:9090/api/login',
        contentType: 'application/json',
        data: json,
        dataType: 'json',
      })
        .done((data) => {
          // nsole.log(data);
          if (data.err) {
            console.log(data.err);
            handleErrors(data.err, '#login-submit');
          } else {
            const user = data;
            localStorage.setItem('user', JSON.stringify(user));
            $('.login-container').hide();
            loggedUserNav();
            const loggedInUser = user;
            console.log(loggedInUser.firstname);
            $('#sp-username').text(loggedInUser.firstname);
          }
        })
        .fail((xhr) => {
          console.log('error', xhr);
        });
  }));


  // Registration Process
  $('#registration-submit').on('submit', ((e) => {
    e.preventDefault();
    localStorage.removeItem('user'); // in case user there clear it
    const user = {};
    user.firstname = $('#registration-submit input[name=firstname]').val();
    user.lastname = $('#registration-submit input[name=lastname]').val();
    user.street = $('#registration-submit input[name=street]').val();
    user.postal = $('#registration-submit input[name=postal]').val();
    user.city = $('#registration-submit input[name=city]').val();
    user.email = $('#registration-submit input[name=email]').val();
    user.pwd = $('#registration-submit input[name=password]').val();
    user.tel = $('#registration-submit input[name=tel]').val();
    const json = JSON.stringify(user);
    console.log(json);
    $.ajax({
      type: 'POST',
      url: 'http://sabinegottfried.tk:9090/api/register',
      contentType: 'application/json',
      data: json
      /* error: (xhr, status) => {
        console.log(`there is an error ${status}`);
      }, */
    })
      .done((data) => {
        console.log(data);
        if (data.err) {
          console.log(data.err);
          handleErrors(data.err, '#registration-submit');
        } else {
          const reguser = data; // Data coming back from request in user variable
          localStorage.setItem('user', JSON.stringify(reguser)); // store it
          guestUserNav();
          $('.register-container').hide();
          $pageContent
          .empty()
          .append(`<div class="container-fluid">
                      <div class="alert alert-success">
                        An activation email was sent to your account.<br/>
                        Please activate to continue. Thanks
                      </div>
                    </div>`)
          
        }
      })
      .fail((xhr) => {
        console.log('error', xhr);
      });
  }));

    // Update Submit
  $('[data-id=update-submit]').on('submit', ((e) => {
    e.preventDefault();
    console.log("AAA")
     // in case user there clear it
    const user = {};
    const lsuser = JSON.parse(localStorage.getItem('user'));
    user.id = lsuser.id;
    user.firstname = $('#update-submit input[name=firstname]').val();
    user.lastname = $('#update-submit input[name=lastname]').val();
    user.birthdate = $('#update-submit input[name=birthdate]').val();
    user.street = $('#update-submit input[name=street]').val();
    user.postal = $('#update-submit input[name=postal]').val();
    user.city = $('#update-submit input[name=city]').val();
    user.pwd = $('#update-submit input[name=password]').val();
    user.tel = $('#update-submit input[name=tel]').val();
    user.email = $('#update-submit input[name=email]').val();
    console.log(user);
    const json = JSON.stringify(user);
     $.ajax({
      type: 'POST',
      url: 'http://sabinegottfried.tk:9090/api/update',
      contentType: 'application/json',
      data: json,
      error: (xhr, status) => {
        console.log(`there is an error ${status}`);
      },
    })
  .done((data) => {
        console.log(data);
        if (data.err) {
          console.log(data.err);
          handleErrors(data.err, '#update-submit');
        } else {
          localStorage.removeItem('user');
          const reguser = data; // Data coming back from request in user variable
          localStorage.setItem('user', JSON.stringify(reguser)); // store it
          $('.register-container').hide();
          $pageContent
          .empty()
          .append(`<div class="alert alert-success">
            Your Account Info was successfully updated!
          </div>`)
          
        }
      })
      .fail((xhr) => {
        console.log('error', xhr);
      });

  }));

  // USER ACTIVATION
  const url = window.location.href;
  if (url.indexOf('activate') >= 0) {
    const code = url.substr(url.length - 20);
    console.log(code);
    const adress = `http://sabinegottfried.tk:9090/api/activate/${code}`;
    console.log(adress);

    $.ajax({
      type: 'PUT',
      url: adress,
      contentType: 'application/json',
    })
      .done((data) => {
        const user = data;
        localStorage.setItem('user', JSON.stringify(user));
        console.log(JSON.stringify(user));
        loggedUserNav();
        $('#sp-username').text();

        if (data.err) {
          $pageContent
           .empty()
            .append(`<div class="alert alert-success">
              There was an error during the registration: 
              ${data.err}
          </div>`);
          }
      });
  }

  // End
});
