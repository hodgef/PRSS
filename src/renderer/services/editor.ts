//import draftToHtml from 'draftjs-to-html';

export const imageUploadCallback = (file) => {
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const img = new Image() as any;
    reader.onload = function () {
      img.src = this.result;
    };
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const originWidth = this.width;
      const originHeight = this.height;

      const maxWidth = 1000,
        maxHeight = 600;

      let targetWidth = originWidth,
        targetHeight = originHeight;

      // Image size exceeds 300x300 limit
      if (originWidth > maxWidth || originHeight > maxHeight) {
        if (originWidth / originHeight > maxWidth / maxHeight) {
          // wider, size limited by width
          targetWidth = maxWidth;
          targetHeight = Math.round(maxWidth * (originHeight / originWidth));
        } else {
          targetHeight = maxHeight;
          targetWidth = Math.round(maxHeight * (originWidth / originHeight));
        }
      }

      // canvas scales the image
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      // clear the canvas
      context.clearRect(0, 0, targetWidth, targetHeight);
      // Image Compression
      context.drawImage(img, 0, 0, targetWidth, targetHeight);
      // compressed image to base64 url
      const newUrl = canvas.toDataURL("image/jpeg", 0.7);

      resolve({
        data: {
          link: newUrl,
        },
      });

      // For uploading
      // canvas.toBlob((blob)=>{
      //  console.log(blob)
      // }, 'image/jpeg', 0.92)
    };
  });
};

export const convertImages = (htmlText) => {
  const regex = /<img\s[^>]*?style\s*=\s*['\"]float([^'\"]*?)['\"][^>]*?>/g;
  let m;
  while ((m = regex.exec(htmlText)) !== null) {
    if (m.index === regex.lastIndex) regex.lastIndex++;
    let repl = null,
      type = null;
    m.forEach((match, groupIndex) => {
      if (groupIndex == 0) repl = match;
      if (groupIndex == 1) type = match;
      if (repl && type) {
        if (type.includes("none"))
          htmlText = htmlText.replace(
            repl,
            '<div style="text-align: center;width: 100%;">' + repl + "</div>"
          );
        else
          htmlText = htmlText.replace(
            repl,
            `<div style="text-align ${type}; width: 100%;">` + repl + "</div>"
          );
        repl = null;
        type = null;
      }
    });
  }
  return htmlText;
};

// export const handleDraftToHtml = editorState => {
//     const htmlText = draftToHtml(editorState);
//     const htmlConverted = convertImages(htmlText); //here I call the function that converts the <img/> to <div><img/></div>.

//     return htmlConverted;
// };

export const editorOptions = {
  autofocus: true,
  uploader: {
    insertImageAsBase64URI: true,
  },
  buttons:
    "source,|,bold,strikethrough,underline,italic,eraser,|,ul,ol,|,font,fontsize,brush,paragraph,align,|,image,video,table,link,|,fullsize",
  buttonsMD:
    "source,|,bold,strikethrough,underline,italic,eraser,|,ul,ol,|,font,fontsize,paragraph,align,|,image,link,dots",
  buttonsSM:
    "source,|,bold,strikethrough,underline,italic,|,font,paragraph,align,image,link,dots",
  buttonsXS:
    "source,|,bold,underline,italic,|,font,paragraph,align,image,link,dots",
  cleanHTML: {
    removeEmptyElements: false,
    fillEmptyParagraph: false,
    replaceNBSP: false,
  },
};
