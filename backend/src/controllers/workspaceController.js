import Workspace from "../models/Workspace.js";
import Document from "../models/Document.js";
import { logAudit } from "../services/core/logger.service.js";

/**
 * Create a new workspace
 */
export const createWorkspace = async (req, res) => {
  try {
    const { name, description, tags, department } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Workspace name is required" });
    }

    const existing = await Workspace.findOne({ userId: req.user._id, name });
    if (existing) {
      return res.status(409).json({ success: false, message: "Workspace with this name already exists" });
    }

    const workspace = await Workspace.create({
      name,
      description,
      userId: req.user._id,
      tags: tags || [],
      department: department || "",
      members: [{ userId: req.user._id, role: "owner" }],
    });

    logAudit("WORKSPACE_CREATED", req.user._id, workspace._id, { name });

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all workspaces for the current user
 */
export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { userId: req.user._id },
        { "members.userId": req.user._id },
      ],
      isActive: true,
    })
      .populate("members.userId", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    // Add document count for each workspace
    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const docCount = await Document.countDocuments({ workspaceId: ws._id });
        return { ...ws, documentCount: docCount };
      })
    );

    res.json({ success: true, workspaces: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single workspace by ID
 */
export const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { "members.userId": req.user._id },
      ],
    })
      .populate("members.userId", "name email")
      .lean();

    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const documents = await Document.find({ workspaceId: workspace._id })
      .select("originalName documentType status totalChunks createdAt fileSize")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, workspace, documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a workspace
 */
export const updateWorkspace = async (req, res) => {
  try {
    const { name, description, tags, department } = req.body;

    if (name) {
      const existing = await Workspace.findOne({
        userId: req.user._id,
        name,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: "Workspace with this name already exists" });
      }
    }

    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { name, description, tags, department } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found or not authorized" });
    }

    logAudit("WORKSPACE_UPDATED", req.user._id, workspace._id, { name });

    res.json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a workspace (soft delete)
 */
export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { returnDocument: 'after' }
    );

    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found or not authorized" });
    }

    logAudit("WORKSPACE_DELETED", req.user._id, workspace._id, {});

    res.json({ success: true, message: "Workspace deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add member to workspace
 */
export const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        $addToSet: {
          members: { userId, role: role || "viewer", joinedAt: new Date() },
        },
      },
      { returnDocument: 'after' }
    );

    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found or not authorized" });
    }

    logAudit("WORKSPACE_MEMBER_ADDED", req.user._id, workspace._id, { addedUserId: userId });

    res.json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remove member from workspace
 */
export const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $pull: { members: { userId: memberId } } },
      { returnDocument: 'after' }
    );

    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found or not authorized" });
    }

    res.json({ success: true, workspace });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};