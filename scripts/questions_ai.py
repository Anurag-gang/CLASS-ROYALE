# Artificial Intelligence & Machine Learning (The Neural Sanctum) - 35 Questions
# 12 Easy, 14 Medium, 7 Hard, 2 Boss

AI_QUESTIONS = [
    # EASY (12)
    {
        "question_text": "What is the primary defining characteristic of Supervised Machine Learning compared to Unsupervised Learning?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Supervised learning trains models on labeled input-output pairs (features X with corresponding target ground truth Y); unsupervised learning discovers inherent patterns in unlabeled data"},
            {"id": "B", "text": "Supervised learning does not use algorithms"},
            {"id": "C", "text": "Unsupervised learning requires humans to label every sample manually"},
            {"id": "D", "text": "Supervised learning cannot be used for classification"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Supervised learning minimizes error against known target labels (e.g. classification classes, regression values). Unsupervised learning operates without ground-truth targets (e.g. clustering, PCA dimensionality reduction).",
        "tags": ["Machine Learning", "Supervised Learning", "Basics"]
    },
    {
        "question_text": "What occurs when a machine learning model suffers from Overfitting?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The model has high training error and high test error"},
            {"id": "B", "text": "The model memorizes noise and specific details of the training dataset (near-zero training loss), but fails to generalize, yielding high error on unseen validation/test data"},
            {"id": "C", "text": "The model runs out of CPU memory during inference"},
            {"id": "D", "text": "The model coefficients are all zero"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Overfitting happens when model capacity/complexity is too high relative to sample size: the model fits idiosyncrasies and random noise in the training set rather than the underlying general distribution.",
        "tags": ["Overfitting", "Generalization", "Model Evaluation"]
    },
    {
        "question_text": "What is the mathematical output range of the standard Sigmoid activation function sigma(z) = 1 / (1 + e^(-z))?",
        "code_snippet": "float sigmoid(float z) {\n    return 1.0f / (1.0f + expf(-z));\n}",
        "options": [
            {"id": "A", "text": "[-1.0, 1.0]"},
            {"id": "B", "text": "(0.0, 1.0)"},
            {"id": "C", "text": "[0.0, +infinity)"},
            {"id": "D", "text": "(-infinity, +infinity)"}
        ],
        "correct_option_id": "B",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "As z -> +infinity, e^(-z) -> 0 and sigma(z) -> 1. As z -> -infinity, e^(-z) -> +infinity and sigma(z) -> 0. Its output is strictly bounded within (0, 1), making it suitable for binary probabilities.",
        "tags": ["Sigmoid", "Activation Functions", "Deep Learning"]
    },
    {
        "question_text": "In a binary classification confusion matrix, what is the formula for Precision?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Precision = True Positives / (True Positives + False Positives)"},
            {"id": "B", "text": "Precision = True Positives / (True Positives + False Negatives)"},
            {"id": "C", "text": "Precision = (True Positives + True Negatives) / Total"},
            {"id": "D", "text": "Precision = False Positives / True Positives"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Precision answers: 'Of all instances the model predicted as Positive, what fraction was actually True Positive?' Recall is TP / (TP + FN).",
        "tags": ["Precision", "Metrics", "Confusion Matrix"]
    },
    {
        "question_text": "What is the optimization objective of Ordinary Least Squares (OLS) in Linear Regression?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Minimizing the sum of squared differences (residuals) between observed target values y and predicted values y_hat"},
            {"id": "B", "text": "Maximizing the number of features"},
            {"id": "C", "text": "Minimizing the number of training epochs"},
            {"id": "D", "text": "Setting all slopes to 1.0"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "OLS finds model weights w that minimize the Residual Sum of Squares: RSS = sum_{i=1}^n (y_i - x_i^T w)^2, producing the closed-form normal equation w = (X^T X)^(-1) X^T y.",
        "tags": ["Linear Regression", "OLS", "Loss Function"]
    },
    {
        "question_text": "Why must feature scaling (such as Standardization or Min-Max Normalization) be applied before training gradient descent algorithms?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To prevent features with large numerical magnitudes from dominating the loss gradients and causing elongated elliptical contour surfaces that slow or destabilize convergence"},
            {"id": "B", "text": "Because gradient descent only accepts inputs between 0 and 1"},
            {"id": "C", "text": "To convert continuous data into categorical text"},
            {"id": "D", "text": "To eliminate the need for bias parameters"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Unscaled features create high-eccentricity loss surfaces where gradients oscillate wildly perpendicular to narrow valleys. Normalizing scales features uniformly, creating spherical contours where gradients point directly to the minimum.",
        "tags": ["Feature Scaling", "Gradient Descent", "Preprocessing"]
    },
    {
        "question_text": "What does the Learning Rate (alpha / eta) hyperparameter control during Gradient Descent optimization?",
        "code_snippet": "w_new = w_old - alpha * grad_loss(w_old);",
        "options": [
            {"id": "A", "text": "The step size taken along the negative gradient direction on each iteration towards the minimum of the loss function"},
            {"id": "B", "text": "The total number of hidden layers in a neural network"},
            {"id": "C", "text": "The precision of floating point numbers in RAM"},
            {"id": "D", "text": "The test accuracy percentage"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "The learning rate scales the gradient vector. If alpha is too small, convergence is agonizingly slow; if alpha is too large, the updates overshoot the minimum and can diverge to infinity.",
        "tags": ["Learning Rate", "Gradient Descent", "Optimization"]
    },
    {
        "question_text": "In K-Means clustering, what is the two-step iteration executed until centroids converge?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "1. Assignment step: Assign each data point to its nearest centroid; 2. Update step: Recompute each centroid as the mean of all points assigned to that cluster"},
            {"id": "B", "text": "1. Randomize labels; 2. Calculate tree depth"},
            {"id": "C", "text": "1. Run linear regression; 2. Compute eigenvalues"},
            {"id": "D", "text": "1. Sort array; 2. Binary search median"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Lloyd's algorithm alternates: 1) Assignment step (E-step) partitions data points by Voronoi cells using minimum Euclidean distance to centroids; 2) Update step (M-step) recalculates cluster centers by vector arithmetic means.",
        "tags": ["K-Means", "Clustering", "Unsupervised Learning"]
    },
    {
        "question_text": "In the Bias-Variance trade-off, what does High Bias typically indicate about a machine learning model?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Underfitting: the model makes strong, overly simplistic assumptions (e.g. fitting a straight line to quadratic data) and fails to capture underlying patterns"},
            {"id": "B", "text": "Overfitting: the model captures too much random noise"},
            {"id": "C", "text": "Perfect classification on all test samples"},
            {"id": "D", "text": "Zero error on training and validation sets"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Bias measures expected error caused by erroneous model assumptions (underfitting). Variance measures sensitivity to small fluctuations in training sets (overfitting). Total Error = Bias^2 + Variance + Irreducible Error.",
        "tags": ["Bias-Variance", "Underfitting", "Model Theory"]
    },
    {
        "question_text": "Which splitting criterion measures impurity in CART (Classification and Regression Trees) for binary decision trees?",
        "code_snippet": "Gini = 1 - sum_{i=1}^C (p_i)^2",
        "options": [
            {"id": "A", "text": "Gini Impurity (or Shannon Entropy)"},
            {"id": "B", "text": "Pearson correlation coefficient"},
            {"id": "C", "text": "Euclidean norm squared"},
            {"id": "D", "text": "Mean Absolute Percentage Error"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "CART uses Gini Impurity (measuring the probability that a randomly chosen element from the set would be incorrectly labeled). ID3 and C4.5 use Information Gain based on Shannon Entropy: -sum p_i log2(p_i).",
        "tags": ["Decision Trees", "Gini Impurity", "Entropy", "CART"]
    },
    {
        "question_text": "What is One-Hot Encoding in machine learning feature engineering?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Converting a categorical feature with K categories into K binary indicator columns (0 or 1), where exactly one column is 1 (hot) per sample"},
            {"id": "B", "text": "Compressing images to 1-bit monochrome"},
            {"id": "C", "text": "Sorting columns by numerical value"},
            {"id": "D", "text": "Converting text into SHA-256 hashes"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "Categorical string labels (e.g. ['Red', 'Green', 'Blue']) cannot be directly multiplied by weights. One-hot encoding creates binary dummy variables without imposing arbitrary numerical order (which label encoding would).",
        "tags": ["One-Hot Encoding", "Feature Engineering", "Preprocessing"]
    },
    {
        "question_text": "Why must a separate held-out Test Set be kept isolated until final model evaluation?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To provide an unbiased assessment of the final model's generalization performance on unseen real-world data, preventing data leakage during hyperparameter tuning"},
            {"id": "B", "text": "Because training sets cannot exceed 100 rows"},
            {"id": "C", "text": "To speed up gradient descent calculations"},
            {"id": "D", "text": "To comply with hardware bus standards"}
        ],
        "correct_option_id": "A",
        "difficulty": "Easy",
        "xp_reward": 50,
        "time_limit_seconds": 30,
        "explanation": "If hyperparameters are tuned on the test set, the model overfits the test set (optimistic bias). Best practice splits data into: Training set (parameter optimization), Validation set (model selection/tuning), and Test set (final benchmark).",
        "tags": ["Test Set", "Data Leakage", "Evaluation"]
    },

    # MEDIUM (14)
    {
        "question_text": "In deep neural networks, how does the Backpropagation algorithm compute partial derivatives of the scalar loss L with respect to weights W in layer l?",
        "code_snippet": "dL/dW^[l] = dL/dZ^[l] * (A^[l-1])^T",
        "options": [
            {"id": "A", "text": "By applying the mathematical Chain Rule of calculus in reverse order from the output layer backward toward the input layer"},
            {"id": "B", "text": "By randomly perturbing weights one at a time via trial-and-error"},
            {"id": "C", "text": "By solving a system of linear equations using Gaussian elimination"},
            {"id": "D", "text": "By recalculating all activations using Monte Carlo simulation"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Backpropagation is reverse-mode automatic differentiation: it caches intermediate forward activations A^[l], then applies the chain rule backward, propagating error terms delta^[l] to calculate weight gradients efficiently in O(parameters) time.",
        "tags": ["Backpropagation", "Chain Rule", "Deep Learning", "Gradients"]
    },
    {
        "question_text": "Why does the Rectified Linear Unit (ReLU) activation function f(x) = max(0, x) mitigate the Vanishing Gradient problem compared to Sigmoid or Tanh in deep networks?",
        "code_snippet": "float relu_grad(float x) {\n    return (x > 0.0f) ? 1.0f : 0.0f;\n}",
        "options": [
            {"id": "A", "text": "For positive inputs (x > 0), the derivative of ReLU is a constant 1.0, allowing error gradients to propagate through deep layers without saturating or decaying exponentially"},
            {"id": "B", "text": "ReLU is a smooth differentiable function everywhere including zero"},
            {"id": "C", "text": "ReLU restricts network weights to positive numbers"},
            {"id": "D", "text": "ReLU computes faster than additions"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Sigmoid's maximum derivative is 0.25; chaining multiple layers multiplies numbers < 0.25, causing gradients to vanish to 0 near early layers. ReLU has derivative 1.0 for x > 0, sustaining robust gradient flow across hundreds of layers.",
        "tags": ["ReLU", "Vanishing Gradient", "Activation Functions"]
    },
    {
        "question_text": "What is the structural difference between L1 Regularization (Lasso) and L2 Regularization (Ridge) regarding feature selection?",
        "code_snippet": "L1 penalty: lambda * sum(|w_i|)\nL2 penalty: (lambda / 2) * sum(w_i^2)",
        "options": [
            {"id": "A", "text": "L1 regularization produces sparse models by driving coefficients of non-informative features exactly to zero (acting as feature selection); L2 shrinks weights asymptotically towards zero without setting them strictly to zero"},
            {"id": "B", "text": "L2 produces sparse models; L1 increases weight sizes"},
            {"id": "C", "text": "L1 is only applicable to neural networks; L2 is only for linear models"},
            {"id": "D", "text": "L2 regularization does not have a lambda hyperparameter"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "The L1 diamond-shaped constraint region has sharp corners on parameter axes; loss contours typically intersect constraint boundaries at axes where w_i = 0 (sparsity). The L2 spherical constraint shrinks weights smoothly without zeroing them.",
        "tags": ["L1 vs L2", "Regularization", "Lasso", "Ridge", "Sparsity"]
    },
    {
        "question_text": "In Random Forest ensemble learning, what two sources of randomness are introduced during tree construction (Bagging)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Bootstrap aggregation (sampling rows with replacement) and random feature subspace sampling (evaluating only a random subset of sqrt(p) features at each split node)"},
            {"id": "B", "text": "Random initial weights and random learning rates"},
            {"id": "C", "text": "Random class labels and random dropout rates"},
            {"id": "D", "text": "Random activation functions at each leaf node"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Breiman's Random Forest decorrelates individual decision trees by combining: 1) Bootstrapping (each tree trains on a distinct resampled dataset); 2) Feature bagging (only a random subset of features is considered at each split), dramatically reducing variance.",
        "tags": ["Random Forest", "Bagging", "Ensemble Methods"]
    },
    {
        "question_text": "How does Gradient Boosting (e.g. XGBoost / LightGBM) build its ensemble compared to Random Forest?",
        "code_snippet": "F_m(x) = F_{m-1}(x) + gamma_m * h_m(x)",
        "options": [
            {"id": "A", "text": "Sequentially: each new weak base learner is trained to predict the pseudo-residuals (negative gradients of the loss function) of the previous ensemble model"},
            {"id": "B", "text": "In parallel: all trees are trained independently on random subsets"},
            {"id": "C", "text": "By averaging predictions of linear regression models"},
            {"id": "D", "text": "By pruning all trees down to depth 1"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Random Forest builds independent trees in parallel and averages them (variance reduction). Gradient Boosting builds trees sequentially, where tree m fits the negative gradient (residual errors) of model m-1 (bias reduction).",
        "tags": ["Gradient Boosting", "XGBoost", "Ensemble Learning"]
    },
    {
        "question_text": "What is the primary role of a Max Pooling layer in a Convolutional Neural Network (CNN)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "To downsample spatial dimensions (height x width) of feature maps, reducing computational parameters and providing translational invariance"},
            {"id": "B", "text": "To increase the image resolution by 2x"},
            {"id": "C", "text": "To convert 2D images into 1D audio frequencies"},
            {"id": "D", "text": "To normalize colors to RGB format"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Max pooling extracts the maximum value within small sliding windows (e.g. 2x2 with stride 2). This cuts spatial area by 75%, reduces memory/FLOP overhead, and grants tolerance to small spatial shifts of features.",
        "tags": ["CNN", "Max Pooling", "Computer Vision"]
    },
    {
        "question_text": "How does Dropout regularization prevent co-adaptation of feature detectors during neural network training?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By randomly deactivating (zeroing) a fraction p of neurons on each training forward-backward pass, preventing neurons from relying on specific companion activations"},
            {"id": "B", "text": "By discarding entire training samples with high loss"},
            {"id": "C", "text": "By setting learning rates to zero intermittently"},
            {"id": "D", "text": "By deleting input features with negative values"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Dropout (Srivastava et al.) forces each unit to learn robust, generalized representations useful in conjunction with diverse random subsets of other units. At inference time, dropout is disabled and weights are scaled by (1 - p).",
        "tags": ["Dropout", "Regularization", "Neural Networks"]
    },
    {
        "question_text": "In a Support Vector Machine (SVM), what is the definition of Support Vectors?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The critical training data points that lie directly on the margins of the separating hyperplane (distance = 1 / ||w||); only these points determine the optimal boundary orientation"},
            {"id": "B", "text": "All points located inside the cluster center"},
            {"id": "C", "text": "Outliers that must be removed before training"},
            {"id": "D", "text": "The orthogonal vectors representing CPU hardware threads"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "SVM finds the maximum-margin hyperplane separating classes. Support vectors are points lying on or violating margin boundaries (alpha_i > 0 in dual problem). Removing any non-support vector training point leaves the decision boundary unchanged.",
        "tags": ["SVM", "Support Vectors", "Margin", "Classification"]
    },
    {
        "question_text": "What does Batch Normalization normalize across during mini-batch gradient descent?",
        "code_snippet": "x_hat = (x - mu_B) / sqrt(sigma_B^2 + epsilon)\ny = gamma * x_hat + beta",
        "options": [
            {"id": "A", "text": "It normalizes each layer's pre-activation inputs across the current mini-batch to zero mean and unit variance, scaling and shifting by learnable parameters gamma and beta"},
            {"id": "B", "text": "It normalizes images to 8-bit integers"},
            {"id": "C", "text": "It averages weights across all training epochs"},
            {"id": "D", "text": "It normalizes loss to range between 0 and 100"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Batch Norm stabilizes internal layer distribution shifts (internal covariate shift), enabling substantially higher learning rates, acting as a mild regularizer, and reducing sensitivity to weight initialization.",
        "tags": ["Batch Normalization", "Deep Learning", "Optimization"]
    },
    {
        "question_text": "How does the Adam Optimizer combine the advantages of AdaGrad/RMSprop and Momentum?",
        "code_snippet": "m_t = beta1 * m_{t-1} + (1 - beta1) * g_t\nv_t = beta2 * v_{t-1} + (1 - beta2) * g_t^2",
        "options": [
            {"id": "A", "text": "It maintains exponentially decaying moving averages of both past gradients (first raw moment / Momentum) and squared gradients (second uncentered moment / RMSprop), with bias correction for early timesteps"},
            {"id": "B", "text": "It switches between SGD and L-BFGS dynamically"},
            {"id": "C", "text": "It eliminates the need to calculate gradients entirely"},
            {"id": "D", "text": "It trains on secondary CPU cores"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Adam (Adaptive Moment Estimation) accelerates through ravines via momentum m_hat while adapting per-parameter learning rates inversely to the root of historical squared gradient variance sqrt(v_hat).",
        "tags": ["Adam Optimizer", "Optimization", "Deep Learning"]
    },
    {
        "question_text": "What is the Cross-Entropy Loss formula for multi-class classification with C classes and Softmax probabilities p_i?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Loss = - sum_{c=1}^C y_c * log(p_c), where y is a one-hot vector and p_c = exp(z_c) / sum exp(z_j)"},
            {"id": "B", "text": "Loss = sum (y_c - p_c)^2"},
            {"id": "C", "text": "Loss = max(0, 1 - y * p)"},
            {"id": "D", "text": "Loss = abs(y - p)"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Categorical cross-entropy derives from maximum likelihood estimation under multinomial distributions. Because y is one-hot (only target class k has y_k=1), Loss = -log(p_k), penalizing confident wrong predictions heavily.",
        "tags": ["Cross-Entropy", "Loss Function", "Softmax"]
    },
    {
        "question_text": "What is Word2Vec's Skip-gram architecture objective compared to Continuous Bag of Words (CBOW)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Skip-gram predicts surrounding context words given a target center word w_t; CBOW predicts the center target word given surrounding context words"},
            {"id": "B", "text": "Skip-gram only operates on numerical datasets"},
            {"id": "C", "text": "CBOW cannot be trained with negative sampling"},
            {"id": "D", "text": "Skip-gram discards all stopwords automatically"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Mikolov et al. defined dual paradigms: CBOW averages context vectors to predict target w_t (fast for frequent words). Skip-gram maximizes log probability of predicting context window words given center word w_t (superior for rare words).",
        "tags": ["Word2Vec", "Skip-gram", "NLP", "Embeddings"]
    },
    {
        "question_text": "Why is the Area Under the Receiver Operating Characteristic Curve (ROC-AUC) insensitive to class distribution shifts?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Because its axes (True Positive Rate = TP/P and False Positive Rate = FP/N) are normalized independently within the positive and negative class totals"},
            {"id": "B", "text": "Because it always equals 1.0 on test sets"},
            {"id": "C", "text": "Because it ignores false positives entirely"},
            {"id": "D", "text": "Because it only applies to balanced binary datasets"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "TPR measures the proportion of positives correctly flagged (unaffected by negative count N). FPR measures the proportion of negatives incorrectly flagged (unaffected by positive count P). Thus, changing class ratios does not alter the curve shape.",
        "tags": ["ROC-AUC", "Evaluation", "Metrics"]
    },
    {
        "question_text": "What is the difference between Type I Error and Type II Error in hypothesis testing and model diagnostics?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "Type I error is a False Positive (rejecting true null hypothesis H0); Type II error is a False Negative (failing to reject false null hypothesis H0)"},
            {"id": "B", "text": "Type I error occurs in hardware; Type II error occurs in software"},
            {"id": "C", "text": "Type I error occurs when accuracy > 90%"},
            {"id": "D", "text": "Type II error is impossible in machine learning"}
        ],
        "correct_option_id": "A",
        "difficulty": "Medium",
        "xp_reward": 100,
        "time_limit_seconds": 45,
        "explanation": "Type I Error (alpha) is a false alarm (e.g. diagnosing a healthy person as ill). Type II Error (beta) is a missed detection (e.g. reporting a sick patient as healthy). Power of a test is 1 - beta.",
        "tags": ["Type I Type II", "Statistics", "Hypothesis Testing"]
    },

    # HARD (7)
    {
        "question_text": "In the standard Transformer architecture (Vaswani et al.), what is the mathematical formula for Scaled Dot-Product Attention, and why is the scaling factor sqrt(d_k) essential?",
        "code_snippet": "Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V",
        "options": [
            {"id": "A", "text": "For large projection dimensions d_k, dot products grow large in magnitude, pushing the Softmax function into regions with extremely tiny gradients; dividing by sqrt(d_k) counteracts this growth to preserve healthy backpropagation gradients"},
            {"id": "B", "text": "sqrt(d_k) converts matrices into unit quaternions"},
            {"id": "C", "text": "It forces the attention weights to sum to infinity"},
            {"id": "D", "text": "It eliminates the need for Key and Value projection matrices"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Assuming components of Q and K are independent random variables with mean 0 and variance 1, their dot product has mean 0 and variance d_k. Dividing by sqrt(d_k) scales variance back to 1, preventing softmax from saturating into near-one-hot states where gradients vanish.",
        "tags": ["Transformers", "Attention Mechanism", "Deep Learning", "Softmax Scaling"]
    },
    {
        "question_text": "In Multi-Head Attention with h heads and model dimension d_model, how are head outputs aggregated before entering the feedforward sub-layer?",
        "code_snippet": "MultiHead(Q, K, V) = Concat(head_1, ..., head_h) * W^O\nwhere head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V)",
        "options": [
            {"id": "A", "text": "The h attention heads (each of dimension d_k = d_model / h) are concatenated along the feature axis into a tensor of size d_model and multiplied by a final projection matrix W^O"},
            {"id": "B", "text": "The heads are averaged using element-wise addition"},
            {"id": "C", "text": "The head with the maximum attention weight is selected and others are deleted"},
            {"id": "D", "text": "The heads are passed into a convolutional filter"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. Concatenating all h heads (dimension d_v) and multiplying by W^O (dimension h*d_v x d_model) projects the output back to dimension d_model.",
        "tags": ["Multi-Head Attention", "Transformers", "Architecture"]
    },
    {
        "question_text": "What is the Bellman Optimality Equation for the state-action value function Q*(s, a) in Reinforcement Learning?",
        "code_snippet": "Q*(s, a) = R(s, a) + gamma * sum_{s'} P(s' | s, a) * [ ??? ]",
        "options": [
            {"id": "A", "text": "max_{a'} Q*(s', a')"},
            {"id": "B", "text": "min_{a'} Q*(s', a')"},
            {"id": "C", "text": "avg_{a'} Q*(s', a')"},
            {"id": "D", "text": "Q*(s, a) / gamma"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "The Bellman Optimality Equation states that the expected return of taking action a in state s under the optimal policy equals the immediate reward R(s, a) plus discounted maximum expected return over all possible next actions a' from next state s': max_{a'} Q*(s', a').",
        "tags": ["Reinforcement Learning", "Bellman Equation", "Q-Learning"]
    },
    {
        "question_text": "How does the Kernel Trick in Support Vector Machines evaluate inner products in an infinite-dimensional Hilbert space (e.g. RBF Kernel) in finite time?",
        "code_snippet": "K(x, z) = exp( - gamma * ||x - z||^2 )",
        "options": [
            {"id": "A", "text": "By computing the kernel function K(x, z) directly in the original low-dimensional input space without explicitly mapping vectors phi(x) into the high-dimensional feature space, permitted by Mercer's Theorem"},
            {"id": "B", "text": "By truncating the Taylor series expansion at 2 terms"},
            {"id": "C", "text": "By calculating eigenvalues of random matrices"},
            {"id": "D", "text": "By approximating the boundary with decision trees"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "Mercer's Theorem guarantees that any continuous symmetric positive semi-definite kernel K(x, z) corresponds to an inner product <phi(x), phi(z)> in some reproducing kernel Hilbert space. We never materialize the infinite phi coordinates.",
        "tags": ["Kernel Trick", "SVM", "Mercer's Theorem", "RBF Kernel"]
    },
    {
        "question_text": "Why is the Kullback-Leibler (KL) Divergence D_KL(P || Q) asymmetric (i.e. D_KL(P || Q) != D_KL(Q || P)), and how does forward KL behave compared to reverse KL?",
        "code_snippet": "D_KL(P || Q) = sum P(x) * log( P(x) / Q(x) )",
        "options": [
            {"id": "A", "text": "Forward KL (P || Q) forces Q to cover all modes of P (zero-avoiding / mean-seeking); reverse KL (Q || P) penalizes Q for putting mass where P is zero, locking onto a single dominant mode (zero-forcing / mode-seeking)"},
            {"id": "B", "text": "KL divergence is symmetric and satisfies the triangle inequality"},
            {"id": "C", "text": "Forward KL is always negative; reverse KL is positive"},
            {"id": "D", "text": "KL divergence can only be computed on uniform distributions"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "In D_KL(P || Q), whenever P(x) > 0, Q(x) must be > 0 to avoid division by zero (Q must cover all P). In D_KL(Q || P), whenever P(x) = 0, Q(x) must be 0 to avoid infinity, causing Q to contract around a single mode (used in Variational Inference).",
        "tags": ["KL Divergence", "Information Theory", "VAEs", "Bayesian"]
    },
    {
        "question_text": "Why is the Precision-Recall (PR) Curve superior to the ROC Curve for evaluating models on severely imbalanced datasets (e.g. 99.9% Negative, 0.1% Positive)?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "The False Positive Rate in ROC divides FP by total True Negatives; when negatives are massive, millions of false positives still yield a deceptively low FPR, whereas Precision directly penalizes false positives against the small true positive count"},
            {"id": "B", "text": "PR curves cannot be calculated on computers"},
            {"id": "C", "text": "ROC curves only work on balanced multi-class problems"},
            {"id": "D", "text": "PR curves always produce higher numerical values than ROC"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "If N = 1,000,000 and FP = 10,000, FPR is only 1% (ROC looks amazing). But if actual positives P = 100, Precision is 100 / (100 + 10,000) = 0.99% (terrible). The PR curve exposes this catastrophic false alarm flood immediately.",
        "tags": ["Imbalanced Data", "PR Curve", "ROC Curve", "Evaluation"]
    },
    {
        "question_text": "In high-dimensional vector spaces (e.g. d = 1536), why does Cosine Similarity often outperform Euclidean (L2) distance for semantic embeddings?",
        "code_snippet": "cos_sim(u, v) = (u . v) / (||u|| * ||v||)",
        "options": [
            {"id": "A", "text": "Cosine similarity measures vector directional orientation invariant to vector magnitude, preventing document length or token frequency from distorting semantic relevance, and mitigates the curse of dimensionality"},
            {"id": "B", "text": "Euclidean distance cannot be computed in more than 3 dimensions"},
            {"id": "C", "text": "Cosine similarity always returns integers"},
            {"id": "D", "text": "Cosine similarity runs in O(1) time while Euclidean runs in O(N^2)"}
        ],
        "correct_option_id": "A",
        "difficulty": "Hard",
        "xp_reward": 200,
        "time_limit_seconds": 60,
        "explanation": "In embedding spaces, document length scales vector magnitude. Cosine similarity normalizes vectors onto the unit hypersphere, comparing directional angular alignment rather than absolute distance, which is crucial for RAG and semantic search.",
        "tags": ["Cosine Similarity", "Vector Embeddings", "RAG", "High-Dimensional"]
    },

    # BOSS (2)
    {
        "question_text": "BOSS BATTLE // THE ROTARY POSITIONAL MONARCH:\nIn modern Large Language Models (LLaMA, Mistral), how does Rotary Position Embedding (RoPE) encode relative token position into query and key projections?",
        "code_snippet": "R_Theta,m^d = diag( R_{theta_1, m}, R_{theta_2, m}, ..., R_{theta_{d/2}, m} )\nwhere R_{theta_i, m} is a 2D rotation matrix by angle m * theta_i",
        "options": [
            {"id": "A", "text": "By structuring the projection into 2D vector pairs and rotating each pair by angle m * theta_i in the complex plane, ensuring that the inner product <R_m q, R_n k> depends purely on relative distance (m - n)"},
            {"id": "B", "text": "By adding fixed sinusoidal values to input token embeddings before the first layer"},
            {"id": "C", "text": "By learning a static lookup table of absolute position vectors"},
            {"id": "D", "text": "By scrambling token order randomly during inference"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "RoPE (Su et al.) marries absolute and relative positional embeddings. By representing query and key slices as complex numbers and rotating by m*theta, dot products satisfy <R_m q, R_n k> = Re[ (q * e^(i m theta)) * (k * e^(i n theta))^* ] = Re[ q k^* e^(i (m - n) theta) ], decaying naturally with relative distance.",
        "tags": ["RoPE", "Transformers", "LLMs", "Mistral", "Boss Challenge"]
    },
    {
        "question_text": "BOSS BATTLE // THE FLASH ATTENTION OVERLORD:\nHow does FlashAttention (Dao et al.) achieve 2x-4x training speedup and linear memory footprint on modern GPUs without altering exact mathematical attention outputs?",
        "code_snippet": None,
        "options": [
            {"id": "A", "text": "By tiling query, key, and value blocks to compute attention entirely within high-speed GPU on-chip SRAM, maintaining running Softmax normalization statistics (online softmax trick) to avoid writing the N x N attention matrix to High Bandwidth Memory (HBM)"},
            {"id": "B", "text": "By pruning 90% of attention weights using low-rank factorization"},
            {"id": "C", "text": "By quantizing all matrix weights to 1-bit binary representations"},
            {"id": "D", "text": "By replacing matrix multiplication with fast Fourier transforms"}
        ],
        "correct_option_id": "A",
        "difficulty": "Boss",
        "xp_reward": 500,
        "time_limit_seconds": 90,
        "explanation": "Standard attention is memory-bandwidth bound (reading/writing the N x N matrix to slow HBM takes O(N^2) memory). FlashAttention uses GPU kernel fusion and online softmax to evaluate blocks in SRAM (20 TB/s), streaming outputs directly and reducing HBM I/O complexity to sub-quadratic.",
        "tags": ["FlashAttention", "GPU Architecture", "SRAM", "Deep Learning", "Boss Challenge"]
    }
]
