# 🌾 GrainScan AI — Intelligent Grain Quality Analysis

![GrainScan AI Banner](./grainscan_ai_banner.png)

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)
[![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org/)

**GrainScan AI** is a state-of-the-art laboratory tool designed for automated grain quality assessment. By combining Computer Vision (OpenCV) with Deep Learning, it provides instant, accurate analysis of rice and wheat samples, identifying defects like broken kernels, chalkiness, and discoloration.

---

## ✨ Key Features

- 🔍 **High-Precision Segmentation**: Uses Otsu's thresholding and contour detection to isolate individual grains from complex backgrounds.
- 🤖 **Dual-Mode AI Engine**: 
    - **Heuristic Mode**: Fast, lightweight analysis using color and shape geometry.
    - **Deep Learning Mode**: Integration with MobileNetV2 for clinical-grade accuracy.
- 📡 **Hardware Interoperability**:
    - **USB Scanner Support**: Folder-watch listener for direct scanner output.
    - **IOT/Network Integration**: REST endpoints for WiFi-enabled scanning devices.
- 📊 **Dynamic Dashboard**: Real-time visualization of quality distribution, grain counts, and annotated image overlays.
- 🔐 **Multi-User Management**: Role-based access control (Technician vs. Inspector) powered by Supabase.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Input Source: Upload/Scanner] --> B[FastAPI Backend]
    B --> C[Image Processing Pipeline]
    
    subgraph "Computer Vision Layer"
    C --> C1[Grayscale/Gaussian Blur]
    C1 --> C2[Otsu Thresholding]
    C2 --> C3[Contour Analysis]
    C3 --> C4[Individual Grain Polishing]
    end
    
    C4 --> D[AI Classifier]
    D --> |MobileNetV2| E[Quality Score & Class]
    
    E --> F[Supabase Cloud Database]
    F --> G[React Analytics Dashboard]
    
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
```

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
1. Create a project on [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor**.
3. Copy and run the contents of [supabase_setup.sql](./supabase_setup.sql).
4. Note your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### 2. Backend Installation
```bash
git clone https://github.com/your-username/grainscan-ai.git
cd grain-analyzer/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start API
uvicorn main:app --reload --port 8000
```
*API docs at: `http://localhost:8000/docs`*

### 3. Frontend Installation
```bash
cd ../frontend

# Install dependencies
npm install

# Setup Environment Variables
# Create a .env file with:
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key

npm run dev
```

---

## 📸 Screenshots

| Dashboard View | AI Analysis Preview |
|----------------|---------------------|
| ![Dashboard Placeholder](https://via.placeholder.com/400x250?text=Analytics+Dashboard) | ![Analysis Placeholder](https://via.placeholder.com/400x250?text=Grain+Segmentation) |

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Python / FastAPI** | High-performance asynchronous API |
| **OpenCV** | Image processing & segmentation |
| **PyTorch** | Deep learning model inference |
| **React / Vite** | Modern reactive UI |
| **Supabase** | Authentication & Database |
| **Tailwind CSS** | Styling & Design System |

---

## 💡 Hardware Recommendations

For optimal results, ensure your scanning environment follows these guidelines:
- **Contrast**: Use a matte white or black background to minimize shadows.
- **Density**: Grains should be spread out; touching grains may be counted as "clumped".
- **Lighting**: Use uniform, top-down lighting to avoid lateral highlights.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for Agricultural Innovation
</p>
 **Background**: Use white or uniform light background
- **Lighting**: Diffuse, even lighting — avoid shadows
- **Arrangement**: Single layer of grains (no stacking/overlap)
- **Resolution**: Higher resolution → better segmentation
- **Distance**: Consistent camera/scanner height for size measurements
