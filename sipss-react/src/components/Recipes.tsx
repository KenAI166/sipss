import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { getRecipes, getRecipeItems, saveRecipe, saveRecipeItem, deleteRecipe, deleteRecipeItem, getProducts, getIngredients } from '../utils/db';

interface Product {
  id: number;
  name: string;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
}

interface Recipe {
  id: number;
  product_id: number;
  product_name: string;
  yield_quantity: number;
  notes: string;
}

interface RecipeItem {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
}

interface RecipesProps {
  user: {
    full_name: string;
    role: string;
  };
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

const Recipes: React.FC<RecipesProps> = ({ user, onLogout, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [showItemsModal, setShowItemsModal] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    yield_quantity: '1',
    notes: '',
  });

  const [itemFormData, setItemFormData] = useState({
    ingredient_id: '',
    quantity: '',
    unit: '',
    notes: '',
  });

  useEffect(() => {
    loadRecipes();
    loadProducts();
    loadIngredients();
  }, []);

  const loadRecipes = async () => {
    try {
      const data = await getRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadIngredients = async () => {
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const handleAdd = () => {
    setEditingRecipe(null);
    setFormData({
      product_id: '',
      product_name: '',
      yield_quantity: '1',
      notes: '',
    });
    setShowModal(true);
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      product_id: recipe.product_id.toString(),
      product_name: recipe.product_name,
      yield_quantity: recipe.yield_quantity.toString(),
      notes: recipe.notes || '',
    });
    setShowModal(true);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    const product = products.find(p => p.id.toString() === productId);
    setFormData({
      ...formData,
      product_id: productId,
      product_name: product ? product.name : '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recipe = {
        id: editingRecipe?.id || 0,
        product_id: parseInt(formData.product_id),
        product_name: formData.product_name,
        yield_quantity: parseInt(formData.yield_quantity) || 1,
        notes: formData.notes,
      };

      const savedRecipe = await saveRecipe(recipe);
      await loadRecipes();
      setShowModal(false);

      if (!editingRecipe) {
        setSelectedRecipe(savedRecipe);
        setRecipeItems([]);
        setShowItemsModal(true);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe(id);
        await loadRecipes();
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  const handleManageItems = async (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    try {
      const items = await getRecipeItems(recipe.id);
      setRecipeItems(items);
    } catch (error) {
      console.error('Error loading recipe items:', error);
    }
    setItemFormData({
      ingredient_id: '',
      quantity: '',
      unit: '',
      notes: '',
    });
    setShowItemsModal(true);
  };

  const handleIngredientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ingredientId = e.target.value;
    const ingredient = ingredients.find(i => i.id.toString() === ingredientId);
    setItemFormData({
      ...itemFormData,
      ingredient_id: ingredientId,
      unit: ingredient ? ingredient.unit : '',
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipe) return;

    try {
      const recipeItem = {
        id: 0,
        recipe_id: selectedRecipe.id,
        ingredient_id: parseInt(itemFormData.ingredient_id),
        quantity: parseFloat(itemFormData.quantity),
        unit: itemFormData.unit,
        notes: itemFormData.notes,
      };

      await saveRecipeItem(recipeItem);
      const items = await getRecipeItems(selectedRecipe.id);
      setRecipeItems(items);
      setItemFormData({
        ingredient_id: '',
        quantity: '',
        unit: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving recipe item:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Remove this ingredient from recipe?')) {
      try {
        await deleteRecipeItem(id);
        if (selectedRecipe) {
          const items = await getRecipeItems(selectedRecipe.id);
          setRecipeItems(items);
        }
      } catch (error) {
        console.error('Error deleting recipe item:', error);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} onNavigate={onNavigate} currentView="recipes" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <i className="fas fa-bars text-gray-700 text-xl"></i>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-black">Recipes (BOM)</h1>
                <p className="text-gray-600">Manage product ingredients and portions</p>
              </div>
            </div>
            <button onClick={handleAdd} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition">
              <i className="fas fa-plus mr-2"></i>Add Recipe
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Product</th>
                    <th className="px-6 py-4 text-left font-medium">Yield Quantity</th>
                    <th className="px-6 py-4 text-left font-medium">Ingredients</th>
                    <th className="px-6 py-4 text-left font-medium">Notes</th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No recipes found. Click "Add Recipe" to create one.
                      </td>
                    </tr>
                  ) : (
                    recipes.map(recipe => (
                      <tr key={recipe.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-black">{recipe.product_name}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{recipe.yield_quantity}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <button
                            onClick={() => handleManageItems(recipe)}
                            className="text-blue-500 hover:text-blue-700 font-medium"
                          >
                            Manage Ingredients
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{recipe.notes || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleEdit(recipe)} className="text-blue-500 hover:text-blue-700">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button onClick={() => handleDelete(recipe.id)} className="text-red-500 hover:text-red-700">
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                {editingRecipe ? 'Edit Recipe' : 'Add Recipe'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">Product *</label>
                  <select
                    value={formData.product_id}
                    onChange={handleProductChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">Yield Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.yield_quantity}
                    onChange={(e) => setFormData({ ...formData, yield_quantity: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of products this recipe makes</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-black transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  {editingRecipe ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemsModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-black">Recipe Ingredients</h2>
                <p className="text-gray-600">{selectedRecipe.product_name} - Yield: {selectedRecipe.yield_quantity}</p>
              </div>
              <button onClick={() => setShowItemsModal(false)} className="text-gray-500 hover:text-black">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleAddItem} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">Ingredient</label>
                  <select
                    value={itemFormData.ingredient_id}
                    onChange={handleIngredientChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select ingredient</option>
                    {ingredients.map(ingredient => (
                      <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.quantity}
                    onChange={(e) => setItemFormData({ ...itemFormData, quantity: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Unit</label>
                  <input
                    type="text"
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Add to Recipe
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ingredient</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recipeItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                        No ingredients added to this recipe yet.
                      </td>
                    </tr>
                  ) : (
                    recipeItems.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-3 text-black">{item.ingredient_name}</td>
                        <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700">
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowItemsModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-6 rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;