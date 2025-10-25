import cupy

print("Number of CUDA devices available:", cupy.cuda.runtime.getDeviceCount())
print("CUDA version:", cupy.cuda.runtime.runtimeGetVersion())
