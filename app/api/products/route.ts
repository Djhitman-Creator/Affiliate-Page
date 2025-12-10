import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/db";

// GET - Fetch all products (or active only for public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === 'true';
    
    const products = await prisma.product.findMany({
      where: showAll ? {} : { active: true },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create a new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { name, price, image, affiliateUrl, category, description } = body;
    
    if (!name || !price || !image || !affiliateUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, image, affiliateUrl' },
        { status: 400 }
      );
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price,
        image,
        affiliateUrl,
        category: category || 'Karaoke Machines',
        active: true,
        sortOrder: 0
      }
    });
    
    return NextResponse.json({ product, success: true });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT - Update a product
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }
    
    const product = await prisma.product.update({
      where: { id },
      data
    });
    
    return NextResponse.json({ product, success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete a product
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }
    
    await prisma.product.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}