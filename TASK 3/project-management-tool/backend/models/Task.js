const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Task must belong to a project']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have a creator']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// --- FIX FOR DATA PERSISTENCE ---
// This Mongoose middleware automatically adds the task's ID to the parent project
// whenever a new task is saved. This is more reliable than doing it in the controller.
// taskSchema.post('save', async function(doc, next) {
//     if (this.isNew) {
//         try {
//             await mongoose.model('Project').findByIdAndUpdate(doc.project, {
//                 $addToSet: { tasks: doc._id }
//             });
//         } catch (error) {
//             return next(error);
//         }
//     }
//     next();
// });

// // This middleware automatically removes the task's ID from the parent project
// // whenever a task is deleted.
// taskSchema.post('findOneAndDelete', async function(next) {
//     try {
//         const docToDelete = await this.model.findOne(this.getQuery());
//         if (docToDelete) {
//             await mongoose.model('Project').findByIdAndUpdate(docToDelete.project, {
//                 $pull: { tasks: docToDelete._id }
//             });
//         }
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

taskSchema.post('save', async function (doc) {
  await mongoose.model('Project').findByIdAndUpdate(doc.project, {
    $addToSet: { tasks: doc._id }
  });
});

taskSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await mongoose.model('Project').findByIdAndUpdate(doc.project, {
      $pull: { tasks: doc._id }
    });
  }
});

module.exports = mongoose.model('Task', taskSchema);
