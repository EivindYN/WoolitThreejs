export const fragmentShader = /*glsl*/`

    #ifdef GL_ES
        precision mediump float;
    #endif

    const int num_points = 256;

    uniform vec2 uPoints[256];
    uniform vec2 uStars[128];
    uniform vec2 uStars2[128];
    uniform vec2 uStars3[128];
    uniform float uTime;

    varying mediump vec2 u_position;
    
    //------------------------------------

    // Author:
    // Title:

    vec2 POS_SCREEN;

    // util
    // -----------
    float lerp(float a, float b, float t){
        return a + (b - a) * t;
    }

    float standarize(float value){
        return lerp(-1.,1.,value);
    }

    vec2 standarize(vec2 value){
        float x = standarize(value.x);
        float y = standarize(value.y);
        return vec2(x,y);
    }

    vec2 invlerp2(vec2 a, vec2 b, vec2 v){
        return vec2((v.x - a.x) / (b.x - a.x),(v.y - a.y) / (b.y - a.y));
    }

    int mod(int x, int y){
        return x - y * int(floor( float(x) / float(y) ));
    }

    bool roundedSquare(vec2 middle, float size, float radius) {
        float insideAmount = length(max(abs(POS_SCREEN - middle)-size+radius,0.0))-radius;
        return insideAmount <= 0.0;
    }

    bool roundedSquare(vec2 middle) {
        return roundedSquare(middle, 0.1, 0.05);
    }

    bool insideArea(vec2 corner1, vec2 corner2){
        float minX = min(corner1.x, corner2.x);
        float maxX = max(corner1.x, corner2.x);
        float minY = min(corner1.y, corner2.y);
        float maxY = max(corner1.y, corner2.y);
        bool X = POS_SCREEN.x >= minX && POS_SCREEN.x <= maxX;
        bool Y = POS_SCREEN.y >= minY && POS_SCREEN.y <= maxY;
        return X && Y;
    }

    bool outwardsCorner(vec2 start, vec2 end){
        vec2 posLerped = invlerp2(end, start, POS_SCREEN);
        return length(posLerped) > 1. && insideArea(start, end);
    }

    bool inwardsCorner(vec2 start, vec2 end){
        return insideArea(start, end) && !outwardsCorner(start, end);
    }

    bool triangle(vec2 start, vec2 end, float width, bool smaller){
        if (smaller){
            float mult = 0.5;
            vec2 middle = (start + end) / 2.;
            start = (start - middle) * mult + middle;
            end = (end - middle) * mult + middle;
            width *= mult;
        }
        vec2 a = POS_SCREEN - start;
        vec2 b = end - start;
        vec2 proj_pos = (b * (a.x * b.x + a.y * b.y) / (b.x * b.x + b.y * b.y)) + start;
        vec2 proj_dir = proj_pos - start;
        vec2 dir = end - start;
        if (sign(proj_dir.y) != sign(dir.y)){
            return false;
        }
        float t = length(proj_dir) / length(dir);
        return length(POS_SCREEN - proj_pos) < width * (1.-t);
    }

    bool triangles(vec2 start, vec2 end, float width, bool smaller){
        vec2 diffY = (end - start);
        vec2 diffX = vec2(diffY.y, -diffY.x);
        float mult = 1.;
        for (int y = -1; y <= 1; y++){
            for (int x = -1; x <= 1; x++){
                if (x != 0 && y == 1){
                    continue;
                }
                vec2 offsetX = diffX * float(x) * mult;
                vec2 offsetY = diffY * (float(y) + abs(float(x)/2.)) * mult;
                vec2 _start = start;
                vec2 _end = end;
                float _width = width;
                /*if (x == 0 && y == 0){
                    vec2 middle = (start + end)/2.;
                    _start += _start - middle;
                    _end += _end - middle;
                    _width *= 2.;
                }*/
                if (triangle(_start + offsetX + offsetY, _end + offsetX + offsetY, _width, smaller)){
                    return true;
                }
            }
        }
        return false;

    }

    bool inwardsCornerLogo(vec2 pos, float diff, float cornerLimitSize, float signX, float signY){
        vec2 inwardsCornerEdge = vec2(pos.x - 0.1 * signX, pos.y - 0.1 * signY);
        vec2 inwardsCornerLimits = inwardsCornerEdge + vec2(signX, signY) * diff;
        bool inwardsCornerSquare = insideArea(inwardsCornerEdge, inwardsCornerLimits);
        vec2 inwardsCornerMax = inwardsCornerEdge + vec2(signX, signY) * max(diff,cornerLimitSize);
        bool inwardsCornerSquareOuter = insideArea(inwardsCornerEdge, inwardsCornerMax);
        bool inwardsSquares = !inwardsCornerSquare && inwardsCornerSquareOuter;

        bool inwardsRight = inwardsCorner(inwardsCornerEdge, inwardsCornerLimits);
        bool inwardsRightWSquares = inwardsRight || inwardsSquares;
        return inwardsRightWSquares;
    }

    bool outwardsCornerLogo(vec2 prevpos, vec2 pos){
        float signX = sign(pos.x- prevpos.x);
        float signY = sign(prevpos.y - pos.y );
        vec2 intersect = vec2(prevpos.x + 0.1 * signX, pos.y + 0.1 * signY);
        vec2 intersectUpperXY = vec2(pos.x + 0.1 * signX, prevpos.y + 0.1 * signY);
        vec2 intersectMiddleXY = (intersectUpperXY + intersect) / 2.;
        float cornerLimitSize = 0.05;
        
        float diffX = min(abs(intersectMiddleXY.x - intersect.x), cornerLimitSize);
        float diffY = min(abs(intersectMiddleXY.y - intersect.y), cornerLimitSize);
        float minDiff = min(diffX, diffY);
        float maxDiff = max(diffX, diffY);
        
        
        float cornerLimitX = intersect.x + minDiff * signX;
        float cornerLimitY = intersect.y + minDiff * signY;
        vec2 cornerLimits = vec2(cornerLimitX,cornerLimitY);

        vec2 corner = vec2(pos.x - 0.05 * signX, pos.y + 0.05 * signY);
        vec2 corner2 = vec2(pos.x - 0.1 * signX, pos.y + 0.1 * signY);

        bool outwardsCorner = outwardsCorner(intersect, cornerLimits);
        bool outwardsSquare = insideArea(corner, corner2); 
        //^ Good when long distance, Bad when short distance, therefore:
        if (maxDiff < cornerLimitSize){
            outwardsSquare = false;
        }
        bool inwardsCornerRight = inwardsCornerLogo(pos, diffY, cornerLimitSize, signX, signY);
        bool inwardsCornerLeft = inwardsCornerLogo(prevpos, diffX, cornerLimitSize, signX, signY);
        return outwardsCorner || outwardsSquare || inwardsCornerRight || inwardsCornerLeft;
    }

    bool outwardsCornersLogo(vec2 prevpos, vec2 pos){
        bool corner1 = outwardsCornerLogo(pos, prevpos);
        bool corner2 = outwardsCornerLogo(prevpos, pos);
        return corner1 || corner2;
    }

    bool star(vec2 pos, float time_mod){
        float height = 0.05 * time_mod * 2.;
        float width = 0.01;
        bool vert_star = triangle(pos, pos + vec2(0.,height), width, false) || triangle(pos, pos - vec2(0.,height), width, false);
        bool hori_star = triangle(pos, pos + vec2(height,0.), width, false) || triangle(pos, pos - vec2(height,0.), width, false);
        return vert_star || hori_star;
    }

    void main() {
        POS_SCREEN = u_position;

        /*if (roundedSquare(vec2(0,0), 1., 0.)){
            gl_FragColor = vec4(0,0,0.1,1.0);   
        }*/
        for (int i=0; i < num_points - 1;++i){
            vec2 prevpos = uPoints[i];
            vec2 pos = uPoints[i+1];
            if (pos.x == -1.){
                gl_FragColor = vec4(0,0,0.1,1.0);   
                for (int n = 0; n < num_points/2; ++n){
                    vec2 star_pos = uStars[n];
                    if (star_pos.x == -1.){
                        break;
                    }
                    float time_mod = uTime * 0.5 - float(int(uTime * 0.5));
                    time_mod = min(time_mod, 1. - time_mod);
                    if (star(star_pos, time_mod)){
                        gl_FragColor += vec4(time_mod,time_mod/1.5,time_mod/1.5,1.0);    
                    }
                }
                for (int n = 0; n < num_points/2; ++n){
                    vec2 star_pos = uStars2[n];
                    if (star_pos.x == -1.){
                        break;
                    }
                    float time_mod = ((uTime + 0.6) * 0.5) - float(int(((uTime + 0.6) * 0.5)));
                    time_mod = min(time_mod, 1. - time_mod);
                    if (star(star_pos, time_mod)){
                        gl_FragColor += vec4(time_mod/1.2,time_mod/1.2,time_mod,1.0);    
                    }
                }
                for (int n = 0; n < num_points/2; ++n){
                    vec2 star_pos = uStars3[n];
                    if (star_pos.x == -1.){
                        break;
                    }
                    float time_mod = ((uTime - 0.6) * 0.5) - float(int(((uTime - 0.6) * 0.5)));
                    time_mod = min(time_mod, 1. - time_mod);
                    if (star(star_pos, time_mod)){
                        gl_FragColor += vec4(time_mod/1.05,time_mod,time_mod/1.05,1.0);    
                    }
                }
                return;
            }
            if (i == 0){
                if (roundedSquare(prevpos * 0.8, 0.01, 0.005)){
                    gl_FragColor = vec4(1,1,1,1.0);
                    return;
                }    
            }
            if (length(POS_SCREEN - pos) > 0.2){
                continue;
            }
            bool hit = false;
            if (length(POS_SCREEN - pos) < 0.05){
                hit = true;
            }
            if (outwardsCornersLogo(prevpos, pos)){
                hit = true;
            }
            if (roundedSquare(pos)){
                hit = true;
            }
            if (hit){
                vec3 colors = vec3(231, 76, 60)/255.;
                colors = vec3(241, 47, 0)/255.;
                if (roundedSquare(pos, 0.09, 0.05)){
                    gl_FragColor = vec4(colors,1.0);         
                    if (roundedSquare(pos - vec2(0,0.125), 0.05, 0.025)){
                        colors = vec3(52, 73, 94)/255.;
                        gl_FragColor = vec4(colors,1.0);
                        return;
                    }
                    vec2 pos_offsetted = pos + vec2(0,0.0);
                    if (triangle(pos_offsetted, pos_offsetted + vec2(0,0.05), 0.03, false)){
                        if (triangle(pos_offsetted, pos_offsetted + vec2(0,0.05), 0.03, true)){
                            colors = vec3(46, 204, 113)/255.;
                            gl_FragColor = vec4(colors,1.0); 
                            return; 
                        }
                        colors = vec3(39, 174, 96)/255.;
                        gl_FragColor = vec4(colors,1.0); 
                        return; 
                    }
                    if (triangles(pos, normalize(prevpos - pos) * 0.1 + pos, 0.02, false)){
                        if (triangles(pos, normalize(prevpos - pos) * 0.1 + pos, 0.02, true)){
                            colors = vec3(211, 84, 0)/255.;
                            gl_FragColor = vec4(colors,1.0); 
                            return; 
                        }
                        colors = vec3(241, 196, 15)/255.;
                        gl_FragColor += vec4(colors,1.0); 
                        return; 
                    }
                    
                    return;
                }
                colors = vec3(192, 57, 43)/255.;
                gl_FragColor = vec4(colors,1.0);         
                return;
            }
        }
        gl_FragColor = vec4(1,0,0,1.0);   
        return;
    }
`;