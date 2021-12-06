let DEG_INCREMENT = 2
let CHI_DEG_INCREMENT = degToRad(2) //chi needs to stay in radians
let SIZE_SCALE_OFFSET = 0.4
let CIRCLE_RAD = 100
let HOLDER_RAD = 125
let EFFECT_RAD = 80

let XOFFSET = 70
let YOFFSET = 100

let GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2.0

let chi = 0

let rotateMat

let globeHolder = document.getElementById('animationContainer')
let senseField = document.getElementById('senseField')

//create the globe based on a fibonacci grid
function createFibGlobe(items){
    let n = items.length
    let elements = [items.length]
    for (let i = 0; i < n; i++){
        j = i
        theta = Math.acos(1 - 2 * j / n)
        phi = 2 * Math.PI * j * GOLDEN_RATIO 
        elements.push([items[i], [radToDeg(theta), radToDeg(phi)]])
    }
    return elements
}

function createGlobe(items){
    //can only handle 2 to 6 items
    if (items.length > 1 && items.length < 7){
        let elements = [items.length]
        switch(items.length){
            case 2:
                elements.push([items[0], [0, 0]])
                elements.push([items[1], [180, 180]])
                break
            case 3:
                elements.push([items[0], [0, 0]])
                elements.push([items[1], [180, 60]])
                elements.push([items[2], [180, -60]])
                break
            case 4:
                elements.push([items[0], [0, 0]])
                elements.push([items[1], [180, 70.5]])  //phi is an estimate
                elements.push([items[2], [120, -32.5]]) 
                elements.push([items[3], [240, -32.5]])
                break
            case 5:
                elements.push([items[0], [0, 0]])
                elements.push([items[1], [120, 0]]) 
                elements.push([items[2], [-120, 0]]) 
                elements.push([items[3], [0, 90]])
                elements.push([items[4], [0, -90]])
            case 6:
                elements.push([items[0], [0, 0]])
                elements.push([items[1], [90, 0]]) 
                elements.push([items[2], [-90, 0]]) 
                elements.push([items[3], [180, 0]])
                elements.push([items[4], [0, -90]])
                elements.push([items[5], [0, 90]])
        }
        return elements
    } else {
        //to many items to try to map points. Create an estimate with fibonaccis grid
        return createFibGlobe(items)
    }
}

function radToDeg(rad){
    return rad * 180.0 / Math.PI
}

function degToRad(deg){
    return deg * Math.PI / 180.0
}

function calculateOffsets(theta, phi, radius){
    let side_off = Math.sin(degToRad(theta)) * Math.cos(degToRad(phi)) * radius
    let z_off = Math.cos(degToRad(theta)) * Math.cos(degToRad(phi)) * radius
    let top_off = Math.sin(degToRad(phi)) * radius
    return [side_off, top_off, z_off]
}

function calculateZScale(zOffset, radius){
    return 1 - SIZE_SCALE_OFFSET * (1 - (zOffset / radius))
}

function rotateRight(elementMap){
    let numE = elementMap[0]
    for (let i = 1; i <= numE; i++){
        let element = elementMap[i]
        let theta = element[1][0]
        theta += DEG_INCREMENT
        if (theta >= 360){
            theta = theta - 360
        }
        element[1][0] = theta
    }
}

function rotateUp(elementMap){
    let numE = elementMap[0]
    for (let i = 1; i <= numE; i++){
        let element = elementMap[i]
        let phi = element[1][1]
        phi += DEG_INCREMENT //might need to implement -90, 90 domain restrictions
        if (phi >= 360){
            phi = phi - 360
        }
        element[1][1] = phi
    }
}

function updateChiMatrix(chi_val){
    let matrix = [[1, 0, 0], [0, Math.cos(chi_val), -Math.sin(chi_val)], [0, Math.sin(chi_val), Math.cos(chi_val)]]

    return matrix
}

function rotateUpMat(){
    chi += CHI_DEG_INCREMENT
    rotateMat = updateChiMatrix(chi)
}

function mulMatrix(mat1, mat2){
    if (mat1[0].length != mat2.length){
        throw Error('matrixes not compatable')
    }
    let values = []
    for (let r = 0; r < mat1[0].length; r++){
        let row = mat1[r]
        let dotsum = 0
        for (let i = 0; i < mat2.length; i++){
            dotsum += row[i]*mat2[i]
        }
        values.push(dotsum)
    }
    return values
}

function preformRotation(rotationMatrix, values){
    let offsets = mulMatrix(rotationMatrix, values)
    return offsets
}

//ignoring z factor for right now
function updateElements(elementMap, rotationMatrix){
    let numE = elementMap[0]
    for (let i = 1; i <= numE; i++){
        let element = elementMap[i]
        let pre_offsets = calculateOffsets(element[1][0], element[1][1], CIRCLE_RAD)
        let offsets = preformRotation(rotationMatrix, pre_offsets)
        let zScale = calculateZScale(offsets[2], CIRCLE_RAD)
        element[0].style.setProperty('transform', 'translate(' 
        + (offsets[0] + XOFFSET) + 'px, ' + (offsets[1] + YOFFSET)
        + 'px) scale(' + zScale + ',' + zScale + ')')
    }
}

//set up elements
let items = document.getElementsByClassName("globeElement")
let elements = createGlobe(items)
rotateMat = updateChiMatrix(chi)
updateElements(elements, rotateMat)

let feedback = document.getElementById("feedback")

let rotationEventInterval

let upInterval
let rightInterval

senseField.addEventListener('mousemove', function(e){

    clearInterval(rotationEventInterval)

    rotationEventInterval = setInterval(function(){
        
        let mouse_x = e.clientX
        let mouse_y = e.clientY
    
        let center_x = globeHolder.getBoundingClientRect().left + HOLDER_RAD
        let center_y = globeHolder.getBoundingClientRect().top + HOLDER_RAD
    
        if (Math.abs(mouse_x - center_x) > EFFECT_RAD){
            //rotate right
        } 
    
        if (Math.abs(mouse_y - center_y) > EFFECT_RAD){
            rotateUpMat(elements)
            updateElements(elements, rotateMat)
        } 

        feedback.innerHTML = (Math.abs(mouse_y - center_y))
    }, 10)
})

senseField.addEventListener('mouseout', function(e){
    clearInterval(rotationEventInterval)
})

document.onmousemove = function(e){
    let mouse_x = e.clientX
    let mouse_y = e.clientY

    let center_x = globeHolder.getBoundingClientRect().left + HOLDER_RAD
    let center_y = globeHolder.getBoundingClientRect().top + HOLDER_RAD

    if (!(Math.abs(mouse_x - center_x) > EFFECT_RAD || Math.abs(mouse_y - center_y) > EFFECT_RAD)){
        clearInterval(rotationEventInterval)
    }
}

// globeHolder.addEventListener('mouseout', function(){
//     clearInterval(rotationEventInterval)
// })

// //set up a interval event
// const rotate = setInterval(function(){
//     // rotateRight(elements)
//     rotateUpMat(elements)
//     updateElements(elements, rotateMat)
// }, 10)


