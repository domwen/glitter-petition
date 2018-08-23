const canvas = document.getElementById('canv');
if (canvas) {
    const context = canvas.getContext('2d');
    // const dataURL = canvas.toDataURL();

    let inCanvas = false;

    // mousedown

    canvas.addEventListener('mousedown', e => {
        context.beginPath();
        inCanvas = true;
        console.log(e.target);
        console.log('Working');

        // mousemove

        canvas.addEventListener('mousemove', e => {
            if (inCanvas) {
                context.lineTo(e.offsetX, e.offsetY);
                context.stroke();
                console.log('Moving');
            }
        });
    });

    // mouseup

    canvas.addEventListener('mouseup', e => {
        inCanvas = false;
        const dataURL = canvas.toDataURL();
        document.getElementById('sig').value = dataURL;
    });
}
