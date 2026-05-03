from PIL import Image
import numpy as np

def get_dominant_color(image_file):
    try:
        img = Image.open(image_file)
        img = img.convert('RGB')
        img = img.resize((150, 150))
        pixels = np.array(img).reshape(-1, 3)
        
        center_y, center_x = 75, 75
        radius = 50
        center_pixels = []
        for y in range(max(0, center_y - radius), min(150, center_y + radius)):
            for x in range(max(0, center_x - radius), min(150, center_x + radius)):
                if (x - center_x)**2 + (y - center_y)**2 <= radius**2:
                    center_pixels.append(img.getpixel((x, y)))
        
        if center_pixels:
            pixels = np.array(center_pixels)
        
        non_extreme = pixels[
            (pixels[:, 0] > 10) & (pixels[:, 0] < 245) &
            (pixels[:, 1] > 10) & (pixels[:, 1] < 245) &
            (pixels[:, 2] > 10) & (pixels[:, 2] < 245)
        ]
        
        if len(non_extreme) > 0:
            pixels = non_extreme
        
        avg_color = np.median(pixels, axis=0).astype(int)
        
        hex_color = '#{:02X}{:02X}{:02X}'.format(avg_color[0], avg_color[1], avg_color[2])
        return hex_color
    except Exception as e:
        raise ValueError(f"Error processing image: {str(e)}")

def hex_to_rgb(hex_color):
    hex_color = str(hex_color).lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))