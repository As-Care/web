$(function(){
 
	resize();
	$(window).resize(function(event) {
		resize();
	});

	$(".ul_tag li").click(function () {
	    $(this).addClass("on").siblings().removeClass("on");

	})
	$(".wow_list .wow").each(function (e) {
	    $(this).attr("data-wow-delay", ($(this).index() / 10) + "s");
	})

	$(".banner").each(function () {
	    if ($(this).find(".item").length > 1) {
	        var owl = $(this).owlCarousel({ items: 1,loop: true, autoplay: true });
	        owl.on('changed.owl.carousel', function (event) {
	            owl.find(".animated").each(function () { $(this).removeClass($(this).attr("data-animation")); })
	            owl.find(".owl-item").eq(event.item.index).find(".animated").each(function () { $(this).addClass($(this).attr("data-animation")); });
            })
            $(".banner_owl .prev").click(function () {
                owl.trigger("prev.owl.carousel")
            });
            $(".banner_owl .next").click(function () {
                owl.trigger("next.owl.carousel")
            })
	    }
	})
	$(".banner .owl-item").eq(2).find(".animated").each(function () {
	    $(this).addClass($(this).attr("data-animation"));
	})
	$(window).scroll(function () {
	    $(".animated").each(function () {
	        if ($(this).offset().top - $(window).scrollTop() > $(window).height() - 80)
	            $(this).removeClass($(this).attr("data-animation"));
	        else
	            $(this).addClass($(this).attr("data-animation"));
	    })

	    if ($(window).scrollTop() > 30) {
	        $(".header").addClass("fixed");
	    }
	    else { $(".header").removeClass("fixed"); }
	})


	$(".menu_wrap").click(function () { $(".header").toggleClass("h_menu") });


	$(window).load(function () {
	    if (!(/msie [6|7|8|9]/i.test(navigator.userAgent))) {
	        new WOW().init();
	    }
    })

    $(".menu").each(function () {
        var menu = $(this);
        $(this).find("li").each(function (e) {
            if (e < (menu.find("li").length - 1) / 2) { $(this).addClass("flt"); }
            else $(this).addClass("frt");
        })
    })
    if ($(".special_owl .item").length > 1) {
        var special = $(".special_owl .owl").owlCarousel({ items: 1, loop: true, dots: false })
        $(".special_owl .prev").click(function () {
            special.trigger("prev.owl.carousel")
        });
        $(".special_owl .next").click(function () {
            special.trigger("next.owl.carousel")
        })
    }

    $(".yh_list .btn a").click(function () { $(".modal_yy").stop().fadeIn(); })
    $(".modal .close").click(function () { $(this).parents(".modal").stop().fadeOut(); })

});

/*main*/
//

function font() {


}


/*call*/
//
function resize(){
	var ht=$(window).height();
	 
} 