function createTipMessage(text) {
    let warninfo3 = document.getElementsByClassName('warninfo3')
    let div2d = document.getElementById('div2d')

    if (warninfo3.length) return
    let html = `<div id="all" class="alert alert-warning warninfo3" role="alert" style="max-width:250px;color: #8a6d3b;background-color: #ffffff;position: absolute;top: 50px;left: 50%;transform: translateX(-50%);z-index: 999;padding: 15px;margin-bottom: 20px;border: 1px solid transparent;border-radius: 4px;"> 
            <span>  ${text}  </span>
            <div id="close" style="box-sizing: content-box;cursor: pointer;position: absolute;top: -7px;right: -8px;width: 16px;height: 16px;border-radius: 50%;background-color: #777777;border: 3px solid #ffffff;"> 
                <div style="position: absolute;width: 10px;height: 2px;background-color: #fff;transform: rotate(45deg);top: 7px;left: 3px;"></div> 
                <div style="position: absolute;width: 10px;height: 2px;background-color: #fff;transform: rotate(-45deg);top: 7px;left: 3px;"></div>
            </div>
            </div>`
    div2d.appendChild(document.createRange().createContextualFragment(html))
    let close = document.getElementById('close')

    close.addEventListener('click', function () {
        hideTipMessage()
    })
}

function showTipMessage(text) {
    let warninfo3 = document.getElementsByClassName('warninfo3')
    let warninfo3Span = document.querySelectorAll('.warninfo3 > span')[0]
    if (warninfo3.length) {
        warninfo3Span.innerHTML = text
    } else {
        createTipMessage(text)
    }
}

function hideTipMessage() {
    document.getElementsByClassName('warninfo3')[0].style.display = 'none'
}

export {
    showTipMessage
}
