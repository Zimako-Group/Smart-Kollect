# Images Folder

This folder contains images used throughout the Smart-Kollect application.

## Usage

Place your image files in this directory and reference them in your components using:

```tsx
import Image from 'next/image'

// For images in the public/images folder
<Image 
  src="/images/your-image.jpg" 
  alt="Description"
  width={500}
  height={300}
/>
```

## Supported Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- WebP (.webp)
- SVG (.svg)
- GIF (.gif)

## Organization

Consider organizing images into subfolders:
- `/logos` - Company and brand logos
- `/icons` - Custom icons and graphics
- `/backgrounds` - Background images
- `/avatars` - User profile images
- `/screenshots` - Application screenshots

## Optimization

For better performance:
- Use WebP format when possible
- Optimize images before uploading
- Use appropriate dimensions for your use case
- Consider using Next.js Image component for automatic optimization
