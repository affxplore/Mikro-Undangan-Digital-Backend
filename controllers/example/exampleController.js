// controllers/exampleController.js
import Example from '../../models/example.js';
import { successResponse, errorResponse } from '../../helpers/response.js';

export const getAllExamples = async (_, res) => {
    try {
        const examples = await Example.findAll();
        successResponse(
            res,
            200,
            'success',
            'Data retrieved successfully',
            false,
            null,
            examples
        );
    } catch (error) {
        errorResponse(
            res,
            400,
            'error',
            error.message,
            false,
            null,
            null
        );
    }
};

// Get Example by ID
export const getExampleById = async (req, res) => {
    try {
        const { id } = req.params;
        const example = await Example.findByPk(id);

        if (!example) {
            return errorResponse(
                res,
                404,
                'error',
                'Data not found',
                false,
                null,
                null
            );
        }

        successResponse(
            res,
            200,
            'success',
            'Data retrieved successfully',
            false,
            null,
            example
        );
    } catch (error) {
        errorResponse(
            res,
            400,
            'error',
            error.message,
            false,
            null,
            null
        );
    }
};

// Create Example
export const createExample = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return errorResponse(
                res,
                400,
                'error',
                'Name is required',
                false,
                null,
                null
            );
        }

        const newExample = await Example.create({ name, description });

        successResponse(
            res,
            201,
            'success',
            'Data created successfully',
            false,
            null,
            newExample
        );
    } catch (error) {
        errorResponse(
            res,
            400,
            'error',
            error.message,
            false,
            null,
            null
        );
    }
};

// Update Example
export const updateExample = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const example = await Example.findByPk(id);
        if (!example) {
            return errorResponse(
                res,
                404,
                'error',
                'Data not found',
                false,
                null,
                null
            );
        }

        await example.update({ name, description });

        successResponse(
            res,
            200,
            'success',
            'Data updated successfully',
            false,
            null,
            example
        );
    } catch (error) {
        errorResponse(
            res,
            400,
            'error',
            error.message,
            false,
            null,
            null
        );
    }
};

// Delete Example
export const deleteExample = async (req, res) => {
    try {
        const { id } = req.params;
        const example = await Example.findByPk(id);

        if (!example) {
            return errorResponse(
                res,
                404,
                'error',
                'Data not found',
                false,
                null,
                null
            );
        }

        await example.destroy();

        successResponse(
            res,
            200,
            'success',
            'Data deleted successfully',
            false,
            null,
            null
        );
    } catch (error) {
        errorResponse(
            res,
            400,
            'error',
            error.message,
            false,
            null,
            null
        );
    }
};


