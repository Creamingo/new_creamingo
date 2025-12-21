# Testimonials Component - Image Customization Guide

## 📸 How to Add Real Customer Images

The testimonials component is designed to easily switch from stock/avatar images to real customer photos. Here's how to customize it:

### 🗂️ **File Structure**
Create this folder structure in your `public` directory:
```
public/
└── images/
    └── testimonials/
        ├── priya-sharma.jpg
        ├── rajesh-patel.jpg
        ├── anjali-desai.jpg
        ├── vikram-singh.jpg
        ├── meera-reddy.jpg
        └── arjun-mehta.jpg
```

### 🔄 **How It Works**

1. **Primary Image**: The component first tries to load the real image from `/images/testimonials/[name].jpg`
2. **Fallback**: If the real image fails to load, it automatically falls back to the stock avatar
3. **Error Handling**: Built-in error handling ensures the component never breaks

### 📝 **Current Configuration**

Each testimonial has two image properties:
```javascript
{
  name: 'Priya Sharma',
  avatar: '/images/testimonials/priya-sharma.jpg',     // Real image path
  stockAvatar: 'https://images.unsplash.com/...',     // Stock avatar fallback
  // ... other properties
}
```

### 🎯 **Steps to Add Real Images**

1. **Prepare Images**: 
   - Use square images (recommended: 300x300px or larger)
   - JPG or PNG format
   - Optimize for web (under 100KB each)

2. **Upload Images**:
   - Place your images in `public/images/testimonials/`
   - Use the exact filenames shown above

3. **Automatic Switch**:
   - Once you add the real images, they'll automatically appear
   - If any image fails to load, the stock avatar will show instead

### 🚀 **Benefits**

- ✅ **Seamless Transition**: No code changes needed
- ✅ **Automatic Fallback**: Stock avatars ensure the component always works
- ✅ **Easy Maintenance**: Just replace image files
- ✅ **Professional Look**: Real customer photos build more trust
- ✅ **Performance**: Optimized image loading with error handling

### 💡 **Tips**

- **Image Quality**: Use high-quality, professional photos
- **Consistent Style**: Try to maintain similar lighting and style across all photos
- **File Naming**: Keep the exact filenames for automatic loading
- **Image Size**: Square images work best for the circular avatar design

### 🔧 **Customization Options**

If you want to change the image paths or add more testimonials, simply edit the `testimonials` array in `src/components/Testimonials.js`.

The component will automatically handle any number of testimonials and maintain the responsive grid layout.
