# Model Files Directory

This directory is where the ONNX model files for Nomic Embed should be placed.

## Required Model Files

1. `nomic-embed-text-v1.5.onnx` - Text embedding model
2. `nomic-embed-vision-v1.5.onnx` - Vision embedding model

## How to Get the Models

The Nomic Embed models can be downloaded from the Hugging Face Model Hub:

- [Nomic Embed Text v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) 
- [Nomic Embed Vision v1.5](https://huggingface.co/nomic-ai/nomic-embed-vision-v1.5)

You'll need to convert the models to ONNX format if they aren't already available in that format.

## Conversion to ONNX

If you need to convert the models to ONNX format, you can use tools like:

- [Hugging Face Optimum](https://huggingface.co/docs/optimum/exporters/onnx/usage_guides/export_a_model)
- [PyTorch's ONNX Export](https://pytorch.org/docs/stable/onnx.html)

## Placeholders for Development

During development, you can create small placeholder files to test the app structure:

```bash
# Create empty placeholder files if needed
touch nomic-embed-text-v1.5.onnx
touch nomic-embed-vision-v1.5.onnx
```

Note that the actual app functionality requires the real model files.